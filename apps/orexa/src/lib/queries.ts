import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
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
  type DifficultyTier,
  type GradedAnswer,
  type QuizQuestion,
  type ResourceKind,
  type TutorMode,
  type TutorRole,
} from "@/db/schema";
import { computeAdaptiveTier, computeLearnerReadiness, type ReadinessProfile } from "@/lib/adaptive";
import type { GroundedCourseContext } from "@/lib/tutor";

export type CourseLessonView = {
  id: string;
  moduleId: string;
  title: string;
  durationMins: number;
  contentMd: string;
  keyTakeaways: string[];
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
};

export type CourseModuleView = {
  id: string;
  courseId: string;
  title: string;
  sortOrder: number;
  lessons: CourseLessonView[];
  completedCount: number;
  totalCount: number;
};

export type CourseResourceView = {
  id: string;
  courseId: string;
  title: string;
  kind: ResourceKind;
  summary: string;
  urlOrRef: string;
};

export type CourseCatalogItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: DifficultyTier;
  description: string;
  instructorName: string;
  published: boolean;
  modules: CourseModuleView[];
  resources: CourseResourceView[];
  totalLessons: number;
  completedLessons: number;
  completionPct: number;
  totalDurationMins: number;
  nextLesson: { id: string; title: string; moduleTitle: string } | null;
};

export type PersonalizedRecommendation = {
  id: string;
  courseId: string;
  courseTitle: string;
  badge: string;
  tier: DifficultyTier;
  reason: string;
  href: string;
  ctaLabel: string;
};

export type RecentAttemptView = {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  courseId: string;
  courseTitle: string;
  scorePct: number;
  difficultyLevel: DifficultyTier;
  recommendation: string;
  actionLabel: string;
  createdAt: string;
};

export type DashboardData = {
  kpis: {
    overallCompletionPct: number;
    completedLessons: number;
    totalLessons: number;
    activeCourses: number;
    avgQuizScorePct: number;
    studyMinsCompleted: number;
    tutorTurns: number;
  };
  readiness: ReadinessProfile;
  quickResume: {
    courseId: string;
    courseTitle: string;
    moduleTitle: string;
    lessonId: string;
    lessonTitle: string;
    durationMins: number;
  } | null;
  courses: CourseCatalogItem[];
  recommendations: PersonalizedRecommendation[];
  recentAttempts: RecentAttemptView[];
};

export async function getCoursesCatalog(
  userId: string,
  options: { includeUnpublished?: boolean } = {},
): Promise<CourseCatalogItem[]> {
  const db = await getDb();
  const [allCourses, allModules, allLessons, userProgress, allResources] = await Promise.all([
    db.select().from(courses).orderBy(asc(courses.createdAt)),
    db.select().from(modules).orderBy(asc(modules.sortOrder), asc(modules.createdAt)),
    db.select().from(lessons).orderBy(asc(lessons.sortOrder), asc(lessons.createdAt)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    db.select().from(resources).orderBy(asc(resources.createdAt)),
  ]);

  const progressMap = new Map(
    userProgress.map((p) => [
      p.lessonId,
      { completed: p.completed, completedAt: p.completedAt ? p.completedAt.toISOString() : null },
    ]),
  );

  const filteredCourses = options.includeUnpublished
    ? allCourses
    : allCourses.filter((c) => c.published);

  return filteredCourses.map((course) => {
    const courseModules = allModules
      .filter((m) => m.courseId === course.id)
      .map((mod) => {
        const modLessons: CourseLessonView[] = allLessons
          .filter((l) => l.moduleId === mod.id)
          .map((l) => {
            const prog = progressMap.get(l.id);
            return {
              id: l.id,
              moduleId: l.moduleId,
              title: l.title,
              durationMins: l.durationMins,
              contentMd: l.contentMd,
              keyTakeaways: Array.isArray(l.keyTakeaways) ? l.keyTakeaways : [],
              sortOrder: l.sortOrder,
              completed: Boolean(prog?.completed),
              completedAt: prog?.completedAt ?? null,
            };
          });

        const completedCount = modLessons.filter((l) => l.completed).length;
        return {
          id: mod.id,
          courseId: mod.courseId,
          title: mod.title,
          sortOrder: mod.sortOrder,
          lessons: modLessons,
          completedCount,
          totalCount: modLessons.length,
        };
      });

    const flatLessons = courseModules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
    );
    const totalLessons = flatLessons.length;
    const completedLessons = flatLessons.filter((l) => l.completed).length;
    const completionPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const totalDurationMins = flatLessons.reduce((sum, l) => sum + l.durationMins, 0);
    const firstIncomplete = flatLessons.find((l) => !l.completed) ?? flatLessons[0] ?? null;

    const courseResources: CourseResourceView[] = allResources
      .filter((r) => r.courseId === course.id)
      .map((r) => ({
        id: r.id,
        courseId: r.courseId,
        title: r.title,
        kind: r.kind,
        summary: r.summary,
        urlOrRef: r.urlOrRef,
      }));

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      category: course.category,
      difficulty: course.difficulty,
      description: course.description,
      instructorName: course.instructorName,
      published: course.published,
      modules: courseModules,
      resources: courseResources,
      totalLessons,
      completedLessons,
      completionPct,
      totalDurationMins,
      nextLesson: firstIncomplete
        ? {
            id: firstIncomplete.id,
            title: firstIncomplete.title,
            moduleTitle: firstIncomplete.moduleTitle,
          }
        : null,
    };
  });
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const db = await getDb();
  const [catalog, userAttempts, allAssessments, userTutorMsgs] = await Promise.all([
    getCoursesCatalog(userId),
    db
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.userId, userId))
      .orderBy(desc(assessmentAttempts.createdAt)),
    db.select().from(assessments),
    db.select({ id: tutorMessages.id }).from(tutorMessages).where(eq(tutorMessages.userId, userId)),
  ]);

  const assessmentMap = new Map(allAssessments.map((a) => [a.id, a]));
  const courseMap = new Map(catalog.map((c) => [c.id, c]));

  const totalLessons = catalog.reduce((sum, c) => sum + c.totalLessons, 0);
  const completedLessons = catalog.reduce((sum, c) => sum + c.completedLessons, 0);
  const overallCompletionPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const studyMinsCompleted = catalog.reduce(
    (sum, c) =>
      sum +
      c.modules.reduce(
        (mSum, m) => mSum + m.lessons.filter((l) => l.completed).reduce((lSum, l) => lSum + l.durationMins, 0),
        0,
      ),
    0,
  );

  const readiness = computeLearnerReadiness(
    userAttempts.map((a) => ({ scorePct: a.scorePct, difficultyLevel: a.difficultyLevel })),
  );

  const recentAttempts: RecentAttemptView[] = userAttempts.slice(0, 6).map((a) => {
    const assess = assessmentMap.get(a.assessmentId);
    const course = assess ? courseMap.get(assess.courseId) : undefined;
    const tier = computeAdaptiveTier(a.scorePct);
    return {
      id: a.id,
      assessmentId: a.assessmentId,
      assessmentTitle: assess?.title ?? "Adaptive Assessment",
      courseId: assess?.courseId ?? "",
      courseTitle: course?.title ?? "Course",
      scorePct: a.scorePct,
      difficultyLevel: a.difficultyLevel,
      recommendation: a.recommendation,
      actionLabel: tier.actionLabel,
      createdAt: a.createdAt.toISOString(),
    };
  });

  // Determine quick resume lesson: prioritize in-progress course first
  const inProgressCourse =
    catalog.find((c) => c.completedLessons > 0 && c.completedLessons < c.totalLessons) ??
    catalog.find((c) => c.totalLessons > 0);

  let quickResume: DashboardData["quickResume"] = null;
  if (inProgressCourse) {
    for (const mod of inProgressCourse.modules) {
      const next = mod.lessons.find((l) => !l.completed);
      if (next) {
        quickResume = {
          courseId: inProgressCourse.id,
          courseTitle: inProgressCourse.title,
          moduleTitle: mod.title,
          lessonId: next.id,
          lessonTitle: next.title,
          durationMins: next.durationMins,
        };
        break;
      }
    }
    if (!quickResume && inProgressCourse.modules[0]?.lessons[0]) {
      const fallback = inProgressCourse.modules[0].lessons[0];
      quickResume = {
        courseId: inProgressCourse.id,
        courseTitle: inProgressCourse.title,
        moduleTitle: inProgressCourse.modules[0].title,
        lessonId: fallback.id,
        lessonTitle: fallback.title,
        durationMins: fallback.durationMins,
      };
    }
  }

  // Personalized recommendations derived from latest assessment attempts + unfinished courses
  const recommendations: PersonalizedRecommendation[] = [];
  const seenCourseIds = new Set<string>();

  for (const attempt of recentAttempts) {
    if (!attempt.courseId || seenCourseIds.has(attempt.courseId)) continue;
    seenCourseIds.add(attempt.courseId);
    const tier = computeAdaptiveTier(attempt.scorePct);
    const course = courseMap.get(attempt.courseId);
    if (!course) continue;

    if (tier.action === "review_foundation") {
      recommendations.push({
        id: `rec-${attempt.id}`,
        courseId: course.id,
        courseTitle: course.title,
        badge: "Review Foundation (< 60%)",
        tier: "foundation",
        reason: attempt.recommendation,
        href: `/courses?course=${course.id}${course.nextLesson ? `&lesson=${course.nextLesson.id}` : ""}`,
        ctaLabel: "Review Foundation Lesson",
      });
    } else if (tier.action === "intermediate_practice") {
      recommendations.push({
        id: `rec-${attempt.id}`,
        courseId: course.id,
        courseTitle: course.title,
        badge: "Intermediate Practice (60–84%)",
        tier: "intermediate",
        reason: attempt.recommendation,
        href: `/assessments?course=${course.id}`,
        ctaLabel: "Practice Intermediate Quiz",
      });
    } else {
      recommendations.push({
        id: `rec-${attempt.id}`,
        courseId: course.id,
        courseTitle: course.title,
        badge: "Advanced Unlocked (≥ 85%)",
        tier: "advanced",
        reason: attempt.recommendation,
        href: `/assessments?course=${course.id}`,
        ctaLabel: "Launch Advanced Challenge",
      });
    }
  }

  for (const course of catalog) {
    if (recommendations.length >= 4) break;
    if (seenCourseIds.has(course.id)) continue;
    if (course.nextLesson) {
      recommendations.push({
        id: `rec-course-${course.id}`,
        courseId: course.id,
        courseTitle: course.title,
        badge: course.completedLessons === 0 ? "Start Track" : "Continue Momentum",
        tier: course.difficulty,
        reason: `Next up: "${course.nextLesson.title}" (${course.completedLessons}/${course.totalLessons} lessons done).`,
        href: `/courses?course=${course.id}&lesson=${course.nextLesson.id}`,
        ctaLabel: "Resume Course",
      });
    }
  }

  return {
    kpis: {
      overallCompletionPct,
      completedLessons,
      totalLessons,
      activeCourses: catalog.length,
      avgQuizScorePct: readiness.avgScorePct,
      studyMinsCompleted,
      tutorTurns: userTutorMsgs.length,
    },
    readiness,
    quickResume,
    courses: catalog,
    recommendations,
    recentAttempts,
  };
}

export type AssessmentCatalogItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  difficulty: DifficultyTier;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    topicTag: string;
  }>;
  questionCount: number;
  bestScorePct: number | null;
  attemptCount: number;
  lastRecommendedTier: DifficultyTier | null;
};

export type AssessmentAttemptRecord = {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  courseId: string;
  courseTitle: string;
  scorePct: number;
  difficultyLevel: DifficultyTier;
  recommendation: string;
  actionLabel: string;
  answers: GradedAnswer[];
  createdAt: string;
};

export async function getAssessmentsPageData(userId: string): Promise<{
  courses: Array<{ id: string; title: string; difficulty: DifficultyTier }>;
  assessments: AssessmentCatalogItem[];
  attempts: AssessmentAttemptRecord[];
  readiness: ReadinessProfile;
}> {
  const db = await getDb();
  const [allCourses, allAssessments, userAttempts] = await Promise.all([
    db.select().from(courses).where(eq(courses.published, true)).orderBy(asc(courses.createdAt)),
    db.select().from(assessments).orderBy(asc(assessments.createdAt)),
    db
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.userId, userId))
      .orderBy(desc(assessmentAttempts.createdAt)),
  ]);

  const courseMap = new Map(allCourses.map((c) => [c.id, c]));
  const assessmentMap = new Map(allAssessments.map((a) => [a.id, a]));

  const catalog: AssessmentCatalogItem[] = allAssessments
    .filter((a) => courseMap.has(a.courseId))
    .map((a) => {
      const relatedAttempts = userAttempts.filter((att) => att.assessmentId === a.id);
      const bestScorePct =
        relatedAttempts.length > 0 ? Math.max(...relatedAttempts.map((x) => x.scorePct)) : null;
      const latest = relatedAttempts[0];
      const questions = (Array.isArray(a.questionsJson) ? a.questionsJson : []) as QuizQuestion[];

      return {
        id: a.id,
        courseId: a.courseId,
        courseTitle: courseMap.get(a.courseId)?.title ?? "Course",
        title: a.title,
        difficulty: a.difficulty,
        questions: questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
          topicTag: q.topicTag,
        })),
        questionCount: questions.length,
        bestScorePct,
        attemptCount: relatedAttempts.length,
        lastRecommendedTier: latest ? computeAdaptiveTier(latest.scorePct).recommendedTier : null,
      };
    });

  const attempts: AssessmentAttemptRecord[] = userAttempts.map((att) => {
    const assess = assessmentMap.get(att.assessmentId);
    const course = assess ? courseMap.get(assess.courseId) : undefined;
    const tier = computeAdaptiveTier(att.scorePct);
    return {
      id: att.id,
      assessmentId: att.assessmentId,
      assessmentTitle: assess?.title ?? "Assessment",
      courseId: assess?.courseId ?? "",
      courseTitle: course?.title ?? "Course",
      scorePct: att.scorePct,
      difficultyLevel: att.difficultyLevel,
      recommendation: att.recommendation,
      actionLabel: tier.actionLabel,
      answers: Array.isArray(att.answersJson) ? att.answersJson : [],
      createdAt: att.createdAt.toISOString(),
    };
  });

  const readiness = computeLearnerReadiness(
    userAttempts.map((a) => ({ scorePct: a.scorePct, difficultyLevel: a.difficultyLevel })),
  );

  return {
    courses: allCourses.map((c) => ({ id: c.id, title: c.title, difficulty: c.difficulty })),
    assessments: catalog,
    attempts,
    readiness,
  };
}

export async function getCourseGroundingContext(courseId: string): Promise<GroundedCourseContext | null> {
  const db = await getDb();
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return null;

  const [courseModules, allLessons, courseResources] = await Promise.all([
    db.select().from(modules).where(eq(modules.courseId, course.id)).orderBy(asc(modules.sortOrder)),
    db.select().from(lessons).orderBy(asc(lessons.sortOrder)),
    db.select().from(resources).where(eq(resources.courseId, course.id)).orderBy(asc(resources.createdAt)),
  ]);

  const moduleMap = new Map(courseModules.map((m) => [m.id, m]));
  const groundedLessons = allLessons
    .filter((l) => moduleMap.has(l.moduleId))
    .map((l) => ({
      id: l.id,
      moduleId: l.moduleId,
      moduleTitle: moduleMap.get(l.moduleId)?.title ?? "Module",
      title: l.title,
      durationMins: l.durationMins,
      contentMd: l.contentMd,
      keyTakeaways: Array.isArray(l.keyTakeaways) ? l.keyTakeaways : [],
    }));

  return {
    courseId: course.id,
    courseTitle: course.title,
    category: course.category,
    difficulty: course.difficulty,
    description: course.description,
    lessons: groundedLessons,
    resources: courseResources.map((r) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      summary: r.summary,
      urlOrRef: r.urlOrRef,
    })),
  };
}

export type TutorMessageView = {
  id: string;
  courseId: string;
  role: TutorRole;
  content: string;
  mode: TutorMode;
  createdAt: string;
};

export async function getTutorThread(userId: string, courseId: string): Promise<TutorMessageView[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(tutorMessages)
    .where(eq(tutorMessages.userId, userId))
    .orderBy(asc(tutorMessages.createdAt));

  return rows
    .filter((r) => r.courseId === courseId)
    .map((r) => ({
      id: r.id,
      courseId: r.courseId,
      role: r.role,
      content: r.content,
      mode: r.mode,
      createdAt: r.createdAt.toISOString(),
    }));
}

export type StudioAnalyticsData = {
  summary: {
    totalLearners: number;
    totalCourses: number;
    totalLessons: number;
    totalResources: number;
    overallCohortCompletionPct: number;
    avgAssessmentScorePct: number;
    totalQuizAttempts: number;
    totalTutorMessages: number;
  };
  coursePerformance: Array<{
    courseId: string;
    title: string;
    category: string;
    difficulty: DifficultyTier;
    lessonCount: number;
    resourceCount: number;
    avgCompletionPct: number;
    avgQuizScorePct: number | null;
    attemptCount: number;
  }>;
  learnerBreakdown: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    completedLessons: number;
    completionPct: number;
    avgQuizScorePct: number | null;
    readinessLabel: string;
  }>;
};

export async function getStudioData(userId: string): Promise<{
  catalog: CourseCatalogItem[];
  analytics: StudioAnalyticsData;
}> {
  const db = await getDb();
  const [
    catalog,
    allUsers,
    allProgress,
    allAssessments,
    allAttempts,
    allTutorMsgs,
  ] = await Promise.all([
    getCoursesCatalog(userId, { includeUnpublished: true }),
    db.select().from(users).orderBy(asc(users.createdAt)),
    db.select().from(lessonProgress),
    db.select().from(assessments),
    db.select().from(assessmentAttempts).orderBy(desc(assessmentAttempts.createdAt)),
    db.select({ id: tutorMessages.id }).from(tutorMessages),
  ]);

  const learners = allUsers.filter((u) => u.role === "student" || u.role === "demo");
  const totalLessons = catalog.reduce((s, c) => s + c.totalLessons, 0);
  const totalResources = catalog.reduce((s, c) => s + c.resources.length, 0);
  const assessmentCourseMap = new Map(allAssessments.map((a) => [a.id, a.courseId]));

  const learnerIds = new Set(learners.map((u) => u.id));
  const completedRows = allProgress.filter((p) => p.completed && learnerIds.has(p.userId));
  const totalPossibleCompletions = Math.max(1, learners.length * totalLessons);
  const overallCohortCompletionPct =
    totalLessons > 0 ? Math.round((completedRows.length / totalPossibleCompletions) * 100) : 0;

  const avgAssessmentScorePct =
    allAttempts.length > 0
      ? Math.round(allAttempts.reduce((sum, a) => sum + a.scorePct, 0) / allAttempts.length)
      : 0;

  const coursePerformance = catalog.map((c) => {
    const lessonIdSet = new Set(c.modules.flatMap((m) => m.lessons.map((l) => l.id)));
    const completedForCourse = completedRows.filter((p) => lessonIdSet.has(p.lessonId)).length;
    const denom = Math.max(1, learners.length * c.totalLessons);
    const avgCompletionPct = c.totalLessons > 0 ? Math.round((completedForCourse / denom) * 100) : 0;

    const courseAttempts = allAttempts.filter(
      (att) => assessmentCourseMap.get(att.assessmentId) === c.id,
    );
    const avgQuizScorePct =
      courseAttempts.length > 0
        ? Math.round(courseAttempts.reduce((s, a) => s + a.scorePct, 0) / courseAttempts.length)
        : null;

    return {
      courseId: c.id,
      title: c.title,
      category: c.category,
      difficulty: c.difficulty,
      lessonCount: c.totalLessons,
      resourceCount: c.resources.length,
      avgCompletionPct,
      avgQuizScorePct,
      attemptCount: courseAttempts.length,
    };
  });

  const learnerBreakdown = learners.map((u) => {
    const done = completedRows.filter((p) => p.userId === u.id).length;
    const completionPct = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
    const uAttempts = allAttempts.filter((a) => a.userId === u.id);
    const readiness = computeLearnerReadiness(
      uAttempts.map((a) => ({ scorePct: a.scorePct, difficultyLevel: a.difficultyLevel })),
    );
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      completedLessons: done,
      completionPct,
      avgQuizScorePct: uAttempts.length > 0 ? readiness.avgScorePct : null,
      readinessLabel: readiness.label,
    };
  });

  return {
    catalog,
    analytics: {
      summary: {
        totalLearners: learners.length,
        totalCourses: catalog.length,
        totalLessons,
        totalResources,
        overallCohortCompletionPct,
        avgAssessmentScorePct,
        totalQuizAttempts: allAttempts.length,
        totalTutorMessages: allTutorMsgs.length,
      },
      coursePerformance,
      learnerBreakdown,
    },
  };
}
