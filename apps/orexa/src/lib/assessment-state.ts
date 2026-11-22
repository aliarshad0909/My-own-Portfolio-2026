export type AssessmentSummary = {
  id: string;
  courseId: string;
};

export type AssessmentCourseOption = {
  id: string;
  title?: string;
};

/**
 * Filters assessments strictly to the active course filter (or returns all when "all").
 */
export function filterAssessmentsByCourse<T extends AssessmentSummary>(
  assessments: readonly T[],
  courseFilter: string,
): T[] {
  if (courseFilter === "all") return [...assessments];
  return assessments.filter((assessment) => assessment.courseId === courseFilter);
}

/**
 * Resolves the active assessment strictly from `visibleAssessments`.
 * Never falls back to assessments outside the active filter, returning `null`
 * whenever `visibleAssessments` is empty.
 */
export function resolveActiveAssessment<T extends AssessmentSummary>(
  visibleAssessments: readonly T[],
  activeAssessmentId: string | null | undefined,
): T | null {
  if (visibleAssessments.length === 0) return null;
  if (activeAssessmentId) {
    const matched = visibleAssessments.find((assessment) => assessment.id === activeAssessmentId);
    if (matched) return matched;
  }
  return visibleAssessments[0] ?? null;
}

/**
 * Reconciles the assessment course filter after a catalog refresh (such as a demo
 * workspace reset that regenerates course UUIDs). Falls back to matching by
 * previous course title, or to "all" if the filtered course no longer exists.
 */
export function reconcileAssessmentCourseFilter(
  courses: readonly AssessmentCourseOption[],
  currentFilter: string,
  previousCourseTitle?: string | null,
): string {
  if (currentFilter === "all") return "all";
  if (courses.some((course) => course.id === currentFilter)) return currentFilter;

  if (previousCourseTitle) {
    const normalized = previousCourseTitle.trim().toLowerCase();
    const matched = courses.find(
      (course) => course.title && course.title.trim().toLowerCase() === normalized,
    );
    if (matched) return matched.id;
  }

  return "all";
}
