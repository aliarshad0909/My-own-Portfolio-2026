import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

// Run tests against isolated in-memory PGlite PostgreSQL so local ./data is never touched
process.env.PGLITE_DATA_DIR = "memory://";
process.env.DATABASE_URL = "";
process.env.OREXA_DATABASE_URL = "";
delete process.env.OREXA_LLM_API_KEY;

import { getDb, resetDemoWorkspace } from "@/db";
import {
  assessmentAttempts,
  assessments,
  courses,
  lessonProgress,
  lessons,
  modules,
  resources,
  tutorMessages,
  users,
  type QuizQuestion,
} from "@/db/schema";
import { computeAdaptiveTier, gradeAssessment } from "@/lib/adaptive";
import {
  filterAssessmentsByCourse,
  reconcileAssessmentCourseFilter,
  resolveActiveAssessment,
} from "@/lib/assessment-state";
import {
  DEMO_ACCOUNT,
  generateLockedPassword,
  hashPassword,
  hashSessionToken,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import {
  getAssessmentsPageData,
  getCourseGroundingContext,
  getCoursesCatalog,
  getDashboardData,
  getStudioData,
  getTutorThread,
} from "@/lib/queries";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { buildDeterministicTutorReply, generateDeterministicLessonOutline } from "@/lib/tutor";
import { extractTutorSelectionHint, reconcileTutorSelection } from "@/lib/tutor-state";
import { courseCreateSchema, lessonCreateSchema, tutorAskSchema } from "@/lib/validation";

describe("Orexa security, validation & adaptive tier unit tests", () => {
  it("enforces scrypt hashing, locked passwords, production session secret, and CSRF origin checks", () => {
    const p1 = generateLockedPassword();
    const p2 = generateLockedPassword();
    assert.equal(p1.length, 64);
    assert.notEqual(p1, p2);

    const h1 = hashPassword(DEMO_ACCOUNT.password);
    const h2 = hashPassword(DEMO_ACCOUNT.password);
    assert.notEqual(h1, h2);
    assert.equal(verifyPassword(DEMO_ACCOUNT.password, h1), true);
    assert.equal(verifyPassword("WrongPassword!", h1), false);

    const tokenHash = hashSessionToken("sample-token");
    assert.equal(tokenHash, hashSessionToken("sample-token"));
    assert.notEqual(tokenHash, "sample-token");

    const prevRender = process.env.RENDER;
    const prevSecret = process.env.SESSION_SECRET;
    try {
      process.env.RENDER = "true";
      process.env.SESSION_SECRET = "short";
      assert.throws(() => resolveSessionSecret(), /at least 32/);
      process.env.SESSION_SECRET = "x".repeat(48);
      assert.equal(resolveSessionSecret(), "x".repeat(48));
    } finally {
      if (prevRender === undefined) delete process.env.RENDER;
      else process.env.RENDER = prevRender;
      if (prevSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = prevSecret;
    }

    const crossOrigin = new Request("https://orexa.aliarshad.co/api/demo/reset", {
      method: "POST",
      headers: { host: "orexa.aliarshad.co", origin: "https://evil.example" },
    });
    assert.equal(verifyCsrfOrigin(crossOrigin)?.status, 403);

    const sameOrigin = new Request("https://orexa.aliarshad.co/api/demo/reset", {
      method: "POST",
      headers: { host: "orexa.aliarshad.co", origin: "https://orexa.aliarshad.co" },
    });
    assert.equal(verifyCsrfOrigin(sameOrigin), null);
  });

  it("enforces adaptive scoring thresholds (<60%, 60-84%, >=85%) accurately", () => {
    assert.equal(computeAdaptiveTier(40).action, "review_foundation");
    assert.equal(computeAdaptiveTier(59).action, "review_foundation");
    assert.equal(computeAdaptiveTier(60).action, "intermediate_practice");
    assert.equal(computeAdaptiveTier(84).action, "intermediate_practice");
    assert.equal(computeAdaptiveTier(85).action, "unlock_advanced");
    assert.equal(computeAdaptiveTier(100).action, "unlock_advanced");
  });

  it("validates schemas with Zod and enforces sliding-window rate limits", () => {
    assert.equal(courseCreateSchema.safeParse({ title: "AI", category: "X", description: "short", instructorName: "A" }).success, false);
    assert.equal(
      courseCreateSchema.safeParse({
        title: "Applied Evaluation Engineering",
        category: "AI Engineering",
        difficulty: "intermediate",
        description: "End-to-end evaluation harnesses for deterministic and LLM pipelines.",
        instructorName: "Dr. Patel",
      }).success,
      true,
    );
    assert.equal(lessonCreateSchema.safeParse({ moduleId: "not-a-uuid", title: "Bad", contentMd: "short" }).success, false);
    assert.equal(tutorAskSchema.safeParse({ courseId: "not-uuid", message: "hi" }).success, false);

    const key = `orexa-test-${Date.now()}`;
    assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
    assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
    assert.equal(checkRateLimit(key, 2, 10_000).allowed, false);
  });

  it("generates deterministic structured lesson outlines for Instructor Studio", () => {
    const draft = generateDeterministicLessonOutline({
      courseTitle: "Applied LLM Systems",
      courseCategory: "AI Engineering",
      topic: "Citation Grounding",
      difficulty: "advanced",
      durationMins: 22,
    });
    assert.equal(draft.mode, "deterministic");
    assert.equal(draft.durationMins, 22);
    assert.match(draft.title, /Citation Grounding/);
    assert.ok(draft.contentMd.includes("Learning Objective"));
    assert.ok(draft.keyTakeaways.length >= 3);
  });
});

describe("Orexa PostgreSQL end-to-end learning workflows", () => {
  it("runs lesson completion progress, adaptive quiz grading, AI tutor persistence, instructor authoring & demo reset", async () => {
    const db = await getDb();

    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);
    assert.ok(demoUser?.id, "demo learner should be seeded");

    // 1. Seeded dashboard baseline
    const initialDash = await getDashboardData(demoUser.id);
    assert.equal(initialDash.kpis.activeCourses, 4);
    assert.ok(initialDash.kpis.totalLessons >= 14);
    assert.ok(initialDash.kpis.completedLessons > 0);
    assert.ok(initialDash.quickResume?.lessonId);

    // 2. Lesson completion persistence updates overall completion % & dashboard analytics
    const targetLessonId = initialDash.quickResume!.lessonId;
    await db
      .insert(lessonProgress)
      .values({
        userId: demoUser.id,
        lessonId: targetLessonId,
        completed: true,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { completed: true, completedAt: new Date() },
      });

    const afterProgressDash = await getDashboardData(demoUser.id);
    assert.equal(
      afterProgressDash.kpis.completedLessons,
      initialDash.kpis.completedLessons + 1,
    );
    assert.ok(afterProgressDash.kpis.overallCompletionPct >= initialDash.kpis.overallCompletionPct);

    // 3. Adaptive quiz server-side grading & attempt persistence
    const [sampleAssessment] = await db.select().from(assessments).limit(1);
    assert.ok(sampleAssessment);
    const questions = sampleAssessment.questionsJson as QuizQuestion[];

    // Perfect submission -> >= 85% unlocks advanced challenge
    const perfectAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: q.correctIndex,
    }));
    const gradedHigh = gradeAssessment(questions, perfectAnswers, "Applied LLM Systems");
    assert.equal(gradedHigh.scorePct, 100);
    assert.equal(gradedHigh.action, "unlock_advanced");

    const [savedAttempt] = await db
      .insert(assessmentAttempts)
      .values({
        userId: demoUser.id,
        assessmentId: sampleAssessment.id,
        scorePct: gradedHigh.scorePct,
        difficultyLevel: sampleAssessment.difficulty,
        answersJson: gradedHigh.gradedAnswers,
        recommendation: gradedHigh.recommendation,
      })
      .returning();
    assert.equal(savedAttempt.scorePct, 100);

    // Low submission -> < 60% recommends foundation review
    const lowAnswers = questions.map((q) => ({
      questionId: q.id,
      selectedIndex: (q.correctIndex + 1) % q.options.length,
    }));
    const gradedLow = gradeAssessment(questions, lowAnswers, "Applied LLM Systems");
    assert.equal(gradedLow.scorePct, 0);
    assert.equal(gradedLow.action, "review_foundation");

    // 4. Deterministic AI Tutor grounded in PostgreSQL course lessons & persisted to tutor_messages
    const catalog = await getCoursesCatalog(demoUser.id);
    const firstCourse = catalog[0];
    const grounding = await getCourseGroundingContext(firstCourse.id);
    assert.ok(grounding);
    assert.ok(grounding.lessons.length > 0);

    const tutorReply = buildDeterministicTutorReply(
      grounding,
      "How does Reciprocal Rank Fusion improve hybrid search retrieval?",
    );
    assert.equal(tutorReply.mode, "deterministic");
    assert.ok(tutorReply.citedLessons.length >= 1);
    assert.match(tutorReply.content, /Grounded in PostgreSQL syllabus sources/);

    await db.insert(tutorMessages).values([
      {
        userId: demoUser.id,
        courseId: firstCourse.id,
        role: "student",
        content: "How does Reciprocal Rank Fusion improve hybrid search retrieval?",
        mode: "deterministic",
      },
      {
        userId: demoUser.id,
        courseId: firstCourse.id,
        role: "tutor",
        content: tutorReply.content,
        mode: tutorReply.mode,
      },
    ]);

    const thread = await getTutorThread(demoUser.id, firstCourse.id);
    assert.ok(thread.length >= 4);

    // 5. Instructor course / module / lesson / resource CRUD + outline persistence
    const [newCourse] = await db
      .insert(courses)
      .values({
        slug: "test-distributed-evals",
        title: "Distributed Evaluation Systems",
        category: "AI Systems",
        difficulty: "advanced",
        description: "Build reproducible benchmark suites for multi-agent learning systems.",
        instructorName: "Dr. Kavita Patel",
        published: true,
      })
      .returning();

    const [newModule] = await db
      .insert(modules)
      .values({
        courseId: newCourse.id,
        title: "Module 1: Deterministic Eval Harnesses",
        sortOrder: 1,
      })
      .returning();

    const generated = generateDeterministicLessonOutline({
      courseTitle: newCourse.title,
      courseCategory: newCourse.category,
      topic: "Regression Golden Sets",
      difficulty: "advanced",
      durationMins: 20,
    });

    const [newLesson] = await db
      .insert(lessons)
      .values({
        moduleId: newModule.id,
        title: generated.title,
        durationMins: generated.durationMins,
        contentMd: generated.contentMd,
        keyTakeaways: generated.keyTakeaways,
        sortOrder: 1,
      })
      .returning();
    assert.ok(newLesson.id);

    const [newResource] = await db
      .insert(resources)
      .values({
        courseId: newCourse.id,
        title: "Eval Harness Checklist",
        kind: "cheatsheet",
        summary: "Quick checklist for deterministic eval coverage.",
        urlOrRef: "orexa://cheatsheets/eval-harness",
      })
      .returning();
    assert.ok(newResource.id);

    const studioAfter = await getStudioData(demoUser.id);
    assert.equal(studioAfter.analytics.summary.totalCourses, 5);

    // 6. Demo reset restores exact baseline counts cleanly
    await resetDemoWorkspace();
    const resetDash = await getDashboardData(demoUser.id);
    assert.equal(resetDash.kpis.activeCourses, 4);
    assert.equal(resetDash.kpis.completedLessons, initialDash.kpis.completedLessons);
  });

  it("reconciles tutor course/lesson IDs after demo dataset reset and submits questions cleanly", async () => {
    const db = await getDb();
    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);
    assert.ok(demoUser?.id);

    // Pure unit checks for reconcileTutorSelection
    const sampleCatalog = [
      {
        id: "course-new-1",
        slug: "applied-llm-systems",
        title: "Applied LLM Systems",
        modules: [
          {
            lessons: [
              { id: "lesson-new-1", title: "Chunking Invariants" },
              { id: "lesson-new-2", title: "Hybrid Search" },
            ],
          },
        ],
      },
      {
        id: "course-new-2",
        slug: "distributed-systems",
        title: "Distributed Systems",
        modules: [{ lessons: [{ id: "lesson-new-3", title: "Consensus Basics" }] }],
      },
    ];

    // Preserves valid IDs when unchanged
    const unchanged = reconcileTutorSelection(sampleCatalog, "course-new-2", "lesson-new-3");
    assert.deepEqual(unchanged, {
      courseId: "course-new-2",
      lessonId: "lesson-new-3",
      courseChanged: false,
      lessonChanged: false,
    });

    // Matches recreated course by slug & lesson by title when UUIDs were regenerated
    const matchedByHint = reconcileTutorSelection(
      sampleCatalog,
      "course-old-deleted",
      "lesson-old-deleted",
      {
        courseSlug: "applied-llm-systems",
        courseTitle: "Applied LLM Systems",
        lessonTitle: "Hybrid Search",
      },
    );
    assert.deepEqual(matchedByHint, {
      courseId: "course-new-1",
      lessonId: "lesson-new-2",
      courseChanged: true,
      lessonChanged: true,
    });

    // Falls back to first course and clears stale lesson when prior custom course no longer exists
    const fallbackToFirst = reconcileTutorSelection(
      sampleCatalog,
      "custom-deleted-course",
      "custom-deleted-lesson",
      {
        courseSlug: "removed-custom-course",
        courseTitle: "Removed Custom Course",
        lessonTitle: "Removed Lesson",
      },
    );
    assert.deepEqual(fallbackToFirst, {
      courseId: "course-new-1",
      lessonId: "",
      courseChanged: true,
      lessonChanged: true,
    });

    // Empty catalog produces empty IDs without throwing
    assert.deepEqual(reconcileTutorSelection([], "stale-course", "stale-lesson"), {
      courseId: "",
      lessonId: "",
      courseChanged: true,
      lessonChanged: true,
    });

    // End-to-end DB reset + tutor submit flow
    const beforeCatalog = await getCoursesCatalog(demoUser.id);
    assert.ok(beforeCatalog.length >= 2);
    const activeCourseBefore = beforeCatalog[1];
    const activeLessonBefore = activeCourseBefore.modules[0]?.lessons[0];
    assert.ok(activeLessonBefore, "expected seeded course to have at least one lesson");

    const previousHint = extractTutorSelectionHint(
      beforeCatalog,
      activeCourseBefore.id,
      activeLessonBefore.id,
    );
    assert.equal(previousHint.courseSlug, activeCourseBefore.slug);
    assert.equal(previousHint.lessonTitle, activeLessonBefore.title);

    // Resetting the demo dataset regenerates all course & lesson UUIDs
    await resetDemoWorkspace();

    // Confirm old deleted courseId is genuinely invalid (reproducing "Selected course not found.")
    const staleGrounding = await getCourseGroundingContext(activeCourseBefore.id);
    assert.equal(staleGrounding, null);

    // Reconcile against refreshed catalog
    const afterCatalog = await getCoursesCatalog(demoUser.id);
    const reconciled = reconcileTutorSelection(
      afterCatalog,
      activeCourseBefore.id,
      activeLessonBefore.id,
      previousHint,
    );

    assert.equal(reconciled.courseChanged, true);
    assert.equal(reconciled.lessonChanged, true);
    assert.notEqual(reconciled.courseId, activeCourseBefore.id);
    assert.notEqual(reconciled.lessonId, activeLessonBefore.id);

    const matchedCourseAfter = afterCatalog.find((c) => c.id === reconciled.courseId);
    assert.ok(matchedCourseAfter);
    assert.equal(matchedCourseAfter.slug, activeCourseBefore.slug);

    const matchedLessonAfter = matchedCourseAfter.modules
      .flatMap((m) => m.lessons)
      .find((l) => l.id === reconciled.lessonId);
    assert.ok(matchedLessonAfter);
    assert.equal(matchedLessonAfter.title, activeLessonBefore.title);

    // Submitting a tutor question using the reconciled IDs succeeds cleanly
    const freshGrounding = await getCourseGroundingContext(reconciled.courseId);
    assert.ok(freshGrounding, "reconciled courseId must resolve grounding context");

    const promptText = "Summarize the core engineering principles from this lesson.";
    const reply = buildDeterministicTutorReply(freshGrounding, promptText, reconciled.lessonId);
    assert.equal(reply.mode, "deterministic");
    assert.ok(reply.content.length > 0);

    await db.insert(tutorMessages).values([
      {
        userId: demoUser.id,
        courseId: reconciled.courseId,
        role: "student",
        content: promptText,
        mode: "deterministic",
      },
      {
        userId: demoUser.id,
        courseId: reconciled.courseId,
        role: "tutor",
        content: reply.content,
        mode: reply.mode,
      },
    ]);

    const persistedThread = await getTutorThread(demoUser.id, reconciled.courseId);
    assert.ok(persistedThread.some((m) => m.role === "student" && m.content === promptText));
    assert.ok(persistedThread.some((m) => m.role === "tutor" && m.content === reply.content));
  });

  it("restricts active assessment strictly to filtered visible assessments including courses with zero quizzes", async () => {
    const db = await getDb();
    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);
    assert.ok(demoUser?.id);

    // Pure unit checks for assessment state helpers
    const mockAssessments = [
      { id: "quiz-a1", courseId: "course-a" },
      { id: "quiz-a2", courseId: "course-a" },
      { id: "quiz-b1", courseId: "course-b" },
    ];

    const emptyVisible = filterAssessmentsByCourse(mockAssessments, "course-empty");
    assert.deepEqual(emptyVisible, []);
    // Must NEVER fall back to another course's quiz when visibleAssessments is empty
    assert.equal(resolveActiveAssessment(emptyVisible, "quiz-a1"), null);

    // When activeAssessmentId belongs to another course, selects first visible assessment only
    const courseBVisible = filterAssessmentsByCourse(mockAssessments, "course-b");
    assert.equal(resolveActiveAssessment(courseBVisible, "quiz-a1")?.id, "quiz-b1");

    // Preserves activeAssessmentId when it belongs to visibleAssessments
    const courseAVisible = filterAssessmentsByCourse(mockAssessments, "course-a");
    assert.equal(resolveActiveAssessment(courseAVisible, "quiz-a2")?.id, "quiz-a2");

    // Reconciles course filter after reset by title or falls back to "all"
    assert.equal(
      reconcileAssessmentCourseFilter(
        [{ id: "new-id-1", title: "Applied LLM Systems" }],
        "old-id-1",
        "Applied LLM Systems",
      ),
      "new-id-1",
    );
    assert.equal(
      reconcileAssessmentCourseFilter(
        [{ id: "new-id-1", title: "Applied LLM Systems" }],
        "removed-course-id",
        "Removed Course",
      ),
      "all",
    );

    // End-to-end DB check: create a published course with 0 assessments
    const [emptyCourse] = await db
      .insert(courses)
      .values({
        slug: "test-zero-assessments-course",
        title: "Zero Assessments Course",
        category: "AI Engineering",
        difficulty: "foundation",
        description: "A brand-new course authored in Instructor Studio before any quiz is attached.",
        instructorName: "Dr. Kavita Patel",
        published: true,
      })
      .returning();
    assert.ok(emptyCourse.id);

    try {
      const pageData = await getAssessmentsPageData(demoUser.id);
      assert.ok(
        pageData.courses.some((c) => c.id === emptyCourse.id),
        "new published course should appear in assessment filter options",
      );

      // Start on a seeded course that has assessments
      const seededCourseWithQuiz = pageData.courses.find((c) =>
        pageData.assessments.some((a) => a.courseId === c.id),
      );
      assert.ok(seededCourseWithQuiz, "expected at least one seeded course with assessments");

      const seededVisible = filterAssessmentsByCourse(
        pageData.assessments,
        seededCourseWithQuiz.id,
      );
      assert.ok(seededVisible.length > 0);
      const initialActive = resolveActiveAssessment(seededVisible, null);
      assert.ok(initialActive);
      assert.equal(initialActive.courseId, seededCourseWithQuiz.id);

      // Switch filter to the newly created course with 0 assessments
      const emptyCourseVisible = filterAssessmentsByCourse(pageData.assessments, emptyCourse.id);
      assert.equal(emptyCourseVisible.length, 0);
      const activeForEmptyCourse = resolveActiveAssessment(emptyCourseVisible, initialActive.id);
      assert.equal(
        activeForEmptyCourse,
        null,
        "switching to a course with 0 assessments must clear activeAssessment instead of keeping another course's quiz",
      );

      // Switch back to the seeded course -> selects a valid quiz belonging to that course
      const backVisible = filterAssessmentsByCourse(
        pageData.assessments,
        seededCourseWithQuiz.id,
      );
      const activeBack = resolveActiveAssessment(backVisible, null);
      assert.ok(activeBack);
      assert.equal(activeBack.courseId, seededCourseWithQuiz.id);
    } finally {
      await resetDemoWorkspace();
    }
  });
});
