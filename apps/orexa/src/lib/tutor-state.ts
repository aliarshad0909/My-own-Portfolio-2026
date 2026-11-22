export type TutorLessonSummary = {
  id: string;
  title: string;
};

export type TutorCourseSummary = {
  id: string;
  slug?: string;
  title: string;
  modules: Array<{
    lessons: TutorLessonSummary[];
  }>;
};

export type TutorSelectionHint = {
  courseSlug?: string | null;
  courseTitle?: string | null;
  lessonTitle?: string | null;
};

export type TutorSelection = {
  courseId: string;
  lessonId: string;
  courseChanged: boolean;
  lessonChanged: boolean;
};

/**
 * Captures stable metadata (course slug/title and optional lesson title) for the
 * currently selected tutor context so it can be matched back after a workspace
 * reset regenerates course and lesson UUIDs.
 */
export function extractTutorSelectionHint(
  courses: readonly TutorCourseSummary[],
  courseId: string,
  lessonId: string,
): TutorSelectionHint {
  const course = courses.find((c) => c.id === courseId);
  if (!course) return {};

  const lesson = lessonId
    ? course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId)
    : undefined;

  return {
    courseSlug: course.slug ?? null,
    courseTitle: course.title,
    lessonTitle: lesson?.title ?? null,
  };
}

/**
 * Reconciles the tutor's selected courseId and lessonId against a refreshed
 * course catalog. If `currentCourseId` no longer exists (for example after
 * `resetDemoWorkspace()` recreates rows with new UUIDs), matches by previous
 * course slug or title when available and otherwise falls back to `courses[0]?.id ?? ""`.
 * Reconciles `currentLessonId` strictly against the resolved course's lessons.
 */
export function reconcileTutorSelection(
  courses: readonly TutorCourseSummary[],
  currentCourseId: string,
  currentLessonId: string,
  previousHint?: TutorSelectionHint,
): TutorSelection {
  if (courses.length === 0) {
    return {
      courseId: "",
      lessonId: "",
      courseChanged: currentCourseId !== "",
      lessonChanged: currentLessonId !== "",
    };
  }

  const normalizedCourseTitle = previousHint?.courseTitle?.trim().toLowerCase() ?? "";
  const resolvedCourse =
    courses.find((c) => c.id === currentCourseId) ??
    (previousHint?.courseSlug
      ? courses.find((c) => c.slug && c.slug === previousHint.courseSlug)
      : undefined) ??
    (normalizedCourseTitle
      ? courses.find((c) => c.title.trim().toLowerCase() === normalizedCourseTitle)
      : undefined) ??
    courses[0];

  const nextCourseId = resolvedCourse.id;
  const courseLessons = resolvedCourse.modules.flatMap((m) => m.lessons);

  let nextLessonId = "";
  if (currentLessonId) {
    const exactLesson = courseLessons.find((l) => l.id === currentLessonId);
    if (exactLesson) {
      nextLessonId = exactLesson.id;
    } else if (previousHint?.lessonTitle) {
      const normalizedLessonTitle = previousHint.lessonTitle.trim().toLowerCase();
      const matchedLesson = courseLessons.find(
        (l) => l.title.trim().toLowerCase() === normalizedLessonTitle,
      );
      nextLessonId = matchedLesson?.id ?? "";
    }
  }

  return {
    courseId: nextCourseId,
    lessonId: nextLessonId,
    courseChanged: nextCourseId !== currentCourseId,
    lessonChanged: nextLessonId !== currentLessonId,
  };
}
