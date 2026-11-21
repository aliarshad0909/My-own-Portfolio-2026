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
  DEMO_ACCOUNT,
  generateLockedPassword,
  hashPassword,
  hashSessionToken,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import {
  getCourseGroundingContext,
  getCoursesCatalog,
  getDashboardData,
  getStudioData,
  getTutorThread,
} from "@/lib/queries";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { buildDeterministicTutorReply, generateDeterministicLessonOutline } from "@/lib/tutor";
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
});
