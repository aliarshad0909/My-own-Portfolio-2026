"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  GraduationCap,
  History,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { DifficultyTier } from "@/db/schema";
import type { AdaptiveEvaluation, ReadinessProfile } from "@/lib/adaptive";
import {
  filterAssessmentsByCourse,
  reconcileAssessmentCourseFilter,
  resolveActiveAssessment,
} from "@/lib/assessment-state";
import type { AssessmentAttemptRecord, AssessmentCatalogItem } from "@/lib/queries";

type Props = {
  initialData: {
    courses: Array<{ id: string; title: string; difficulty: DifficultyTier }>;
    assessments: AssessmentCatalogItem[];
    attempts: AssessmentAttemptRecord[];
    readiness: ReadinessProfile;
  };
  initialCourseId?: string;
};

function tierBadge(tier: DifficultyTier) {
  if (tier === "advanced") return "border-violet-500/35 bg-violet-500/15 text-violet-200";
  if (tier === "intermediate") return "border-amber-500/35 bg-amber-500/15 text-amber-200";
  return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
}

function resolveInitialFilter(
  courses: Props["initialData"]["courses"],
  initialCourseId?: string,
): string {
  if (initialCourseId && courses.some((c) => c.id === initialCourseId)) {
    return initialCourseId;
  }
  return "all";
}

export function AssessmentsClient({ initialData, initialCourseId }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [prevInitialData, setPrevInitialData] = useState(initialData);
  const [courseFilter, setCourseFilter] = useState<string>(() =>
    resolveInitialFilter(initialData.courses, initialCourseId),
  );
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(() => {
    const initialFilter = resolveInitialFilter(initialData.courses, initialCourseId);
    const initialVisible = filterAssessmentsByCourse(initialData.assessments, initialFilter);
    return resolveActiveAssessment(initialVisible, null)?.id ?? null;
  });

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    assessmentId: string;
    evaluation: AdaptiveEvaluation;
  } | null>(null);

  if (initialData !== prevInitialData) {
    const previousCourseTitle = data.courses.find((c) => c.id === courseFilter)?.title ?? null;
    const nextFilter = reconcileAssessmentCourseFilter(
      initialData.courses,
      courseFilter,
      previousCourseTitle,
    );
    const nextVisible = filterAssessmentsByCourse(initialData.assessments, nextFilter);
    const nextActive = resolveActiveAssessment(nextVisible, activeAssessmentId);

    setPrevInitialData(initialData);
    setData(initialData);
    setCourseFilter(nextFilter);
    setActiveAssessmentId(nextActive?.id ?? null);
    setSelectedAnswers({});
    setLastResult(null);
  }

  const filterContextRef = useRef<{
    courseFilter: string;
    activeAssessmentId: string | null;
    courseTitle: string | null;
  }>({
    courseFilter,
    activeAssessmentId,
    courseTitle: data.courses.find((c) => c.id === courseFilter)?.title ?? null,
  });
  const refreshSeqRef = useRef(0);
  const refreshAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    filterContextRef.current = {
      courseFilter,
      activeAssessmentId,
      courseTitle: data.courses.find((c) => c.id === courseFilter)?.title ?? null,
    };
  }, [courseFilter, activeAssessmentId, data.courses]);

  useEffect(() => {
    return () => {
      refreshAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const onRefresh = async () => {
      const seq = ++refreshSeqRef.current;
      refreshAbortRef.current?.abort();
      const controller = new AbortController();
      refreshAbortRef.current = controller;

      try {
        const res = await fetch("/api/assessments", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok || seq !== refreshSeqRef.current || controller.signal.aborted) {
          return;
        }

        const refreshed = (await res.json()) as Props["initialData"];
        const current = filterContextRef.current;
        const nextFilter = reconcileAssessmentCourseFilter(
          refreshed.courses,
          current.courseFilter,
          current.courseTitle,
        );
        const nextVisible = filterAssessmentsByCourse(refreshed.assessments, nextFilter);
        const nextActive = resolveActiveAssessment(nextVisible, current.activeAssessmentId);

        setData(refreshed);
        setCourseFilter(nextFilter);
        setActiveAssessmentId(nextActive?.id ?? null);
        setSelectedAnswers({});
        setLastResult(null);
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          toast("Unable to refresh assessments.", "error");
        }
      }
    };
    window.addEventListener("orexa:refresh", onRefresh);
    return () => window.removeEventListener("orexa:refresh", onRefresh);
  }, [toast]);

  const visibleAssessments = useMemo(
    () => filterAssessmentsByCourse(data.assessments, courseFilter),
    [data.assessments, courseFilter],
  );

  const activeAssessment = useMemo(
    () => resolveActiveAssessment(visibleAssessments, activeAssessmentId),
    [visibleAssessments, activeAssessmentId],
  );

  const selectedCourseTitle = useMemo(() => {
    if (courseFilter === "all") return null;
    return data.courses.find((c) => c.id === courseFilter)?.title ?? null;
  }, [data.courses, courseFilter]);

  const currentResult =
    lastResult && activeAssessment && lastResult.assessmentId === activeAssessment.id
      ? lastResult.evaluation
      : null;

  const chooseAssessment = useCallback((id: string | null) => {
    setActiveAssessmentId(id);
    setSelectedAnswers({});
    setLastResult(null);
  }, []);

  const handleCourseFilterChange = useCallback(
    (nextFilter: string) => {
      setCourseFilter(nextFilter);
      const nextVisible = filterAssessmentsByCourse(data.assessments, nextFilter);
      const nextActive = resolveActiveAssessment(nextVisible, null);
      chooseAssessment(nextActive?.id ?? null);
    },
    [data.assessments, chooseAssessment],
  );

  async function handleSubmitQuiz() {
    if (!activeAssessment) return;
    const answers = activeAssessment.questions.map((q) => ({
      questionId: q.id,
      selectedIndex: selectedAnswers[q.id] ?? -1,
    }));

    if (answers.some((a) => a.selectedIndex < 0)) {
      toast("Select an answer for every question before submitting.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessments/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: activeAssessment.id,
          answers,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to grade assessment.", "error");
        return;
      }

      setLastResult({
        assessmentId: activeAssessment.id,
        evaluation: payload.evaluation as AdaptiveEvaluation,
      });

      const refreshed = await fetch("/api/assessments", { cache: "no-store" });
      if (refreshed.ok) {
        setData(await refreshed.json());
      }

      toast(
        `Graded ${payload.evaluation.scorePct}% — ${payload.evaluation.actionLabel}`,
        "success",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Adaptive Engine Overview Header */}
      <section className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 px-3 py-1 text-xs font-semibold text-[#ffb4a2]">
              <Flame className="h-3.5 w-3.5 text-[#ff6b4a]" />
              <span>Adaptive Engine: {data.readiness.label}</span>
            </div>
            <h1 className="mt-2.5 text-xl font-bold text-white sm:text-2xl">
              Adaptive Quizzes &amp; Mastery Assessments
            </h1>
            <p className="mt-1 text-xs text-[#9ca7bc]">
              Server-side grading calibrates your next tier dynamically: &lt; 60% reviews foundation, 60–84%
              recommends intermediate practice, and ≥ 85% unlocks advanced challenges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={courseFilter}
              onChange={(e) => handleCourseFilterChange(e.target.value)}
              aria-label="Filter assessments by course"
              className="rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs font-medium text-white focus:border-[#ff6b4a] focus:outline-none"
            >
              <option value="all">All Courses</option>
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Assessment Selector + Attempt History */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
            <div className="flex items-center gap-2 border-b border-[#222838] pb-3">
              <GraduationCap className="h-4 w-4 text-[#ff6b4a]" />
              <h2 className="text-sm font-bold text-white">Available Assessments</h2>
            </div>

            {visibleAssessments.length === 0 ? (
              <p className="mt-3 text-xs text-[#8d99ae]">
                No assessments yet for {selectedCourseTitle ? `"${selectedCourseTitle}"` : "this filter"}.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {visibleAssessments.map((assess) => {
                  const selected = activeAssessment?.id === assess.id;
                  return (
                    <button
                      key={assess.id}
                      type="button"
                      onClick={() => chooseAssessment(assess.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-[#ff6b4a] bg-[#1a1f2c]"
                          : "border-[#242c3e] bg-[#0f131b] hover:border-[#39455e]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-semibold capitalize ${tierBadge(assess.difficulty)}`}
                        >
                          {assess.difficulty}
                        </span>
                        {assess.bestScorePct !== null ? (
                          <span className="text-xs font-bold text-emerald-400">
                            Best: {assess.bestScorePct}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#7e8a9f]">Not attempted</span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-bold text-white">{assess.title}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#8d99ae]">
                        {assess.courseTitle} · {assess.questionCount} questions
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attempt History */}
          <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
            <div className="flex items-center gap-2 border-b border-[#222838] pb-3">
              <History className="h-4 w-4 text-[#ff6b4a]" />
              <h2 className="text-sm font-bold text-white">Persisted Attempt History</h2>
            </div>

            {data.attempts.length === 0 ? (
              <p className="mt-3 text-xs text-[#8d99ae]">No attempts logged yet.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {data.attempts.slice(0, 6).map((att) => (
                  <div
                    key={att.id}
                    className="rounded-xl border border-[#242c3e] bg-[#0f131b] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold text-white">
                        {att.assessmentTitle}
                      </span>
                      <span
                        className={`shrink-0 text-sm font-bold ${
                          att.scorePct >= 85
                            ? "text-emerald-400"
                            : att.scorePct >= 60
                              ? "text-amber-300"
                              : "text-[#ff6b4a]"
                        }`}
                      >
                        {att.scorePct}%
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-[#ff8a6f]">{att.actionLabel}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-[#8d99ae]">
                      {att.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right: Interactive Quiz Runner */}
        <section className="lg:col-span-8">
          {activeAssessment ? (
            <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#222838] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#ff8a6f]">
                      {activeAssessment.courseTitle}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize ${tierBadge(activeAssessment.difficulty)}`}
                    >
                      {activeAssessment.difficulty} tier
                    </span>
                  </div>
                  <h2 className="mt-1.5 text-lg font-bold text-white sm:text-xl">
                    {activeAssessment.title}
                  </h2>
                </div>
                {currentResult ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswers({});
                      setLastResult(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3548] bg-[#0f131b] px-3 py-2 text-xs font-semibold text-[#cbd4e4] hover:border-[#ff6b4a]/60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                ) : null}
              </div>

              {/* Adaptive Grading Result Banner */}
              {currentResult ? (
                <div className="mt-5 rounded-2xl border border-[#ff6b4a]/40 bg-gradient-to-br from-[#1c161b] to-[#131722] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6b4a]/15 text-lg font-bold text-[#ff6b4a]">
                        {currentResult.scorePct}%
                      </span>
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-[#ff8a6f] uppercase">
                          {currentResult.actionLabel}
                        </p>
                        <p className="text-sm font-bold text-white">
                          {currentResult.correctCount} of {currentResult.totalQuestions} answers correct
                        </p>
                      </div>
                    </div>
                    <Award className="h-6 w-6 text-[#ff6b4a]" />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#d7dfec]">
                    {currentResult.recommendation}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/courses?course=${activeAssessment.courseId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-3.5 py-2 text-xs font-semibold text-white hover:brightness-110"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Open Recommended Course Material</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/tutor?course=${activeAssessment.courseId}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3548] bg-[#141821] px-3.5 py-2 text-xs font-semibold text-[#cbd4e4] hover:border-[#ff6b4a]/60"
                    >
                      <span>Review Missed Concepts with AI Tutor</span>
                    </Link>
                  </div>
                </div>
              ) : null}

              {/* Questions List */}
              <div className="mt-5 space-y-5">
                {activeAssessment.questions.map((q, qIdx) => {
                  const graded = currentResult?.gradedAnswers.find((g) => g.questionId === q.id);
                  return (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-[#242c3e] bg-[#0f131b] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-[#ff8a6f]">
                          Question {qIdx + 1} of {activeAssessment.questions.length}
                        </span>
                        <span className="rounded bg-[#1a202d] px-2 py-0.5 text-[10px] font-medium text-[#9ca7bc]">
                          {q.topicTag}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{q.prompt}</p>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isChosen = selectedAnswers[q.id] === oIdx;
                          const isCorrectOption = graded && graded.correctIndex === oIdx;
                          const isWrongChoice = graded && isChosen && !graded.isCorrect;

                          let style =
                            "border-[#262e40] bg-[#141821] text-[#cbd4e4] hover:border-[#3d4963]";
                          if (isCorrectOption) {
                            style = "border-emerald-500/60 bg-emerald-500/15 text-emerald-100";
                          } else if (isWrongChoice) {
                            style = "border-red-500/60 bg-red-500/15 text-red-100";
                          } else if (isChosen) {
                            style = "border-[#ff6b4a] bg-[#ff6b4a]/15 text-white";
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={Boolean(currentResult)}
                              onClick={() =>
                                setSelectedAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                              }
                              className={`flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${style}`}
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="flex-1 leading-relaxed">{opt}</span>
                              {isCorrectOption ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                              ) : isWrongChoice ? (
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      {graded ? (
                        <p className="mt-3 rounded-xl border border-[#262e40] bg-[#141821] px-3 py-2 text-xs text-[#a8b2c5]">
                          <strong className="text-white">Explanation:</strong> {graded.explanation}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {!currentResult ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#222838] pt-4">
                  <span className="text-xs text-[#8d99ae]">
                    Answered {Object.keys(selectedAnswers).length} of {activeAssessment.questions.length} questions
                  </span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitQuiz}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#ff6b4a]/20 transition hover:brightness-110 disabled:opacity-60"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>{submitting ? "Grading on Server…" : "Submit & Compute Adaptive Tier"}</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#2d3548] bg-[#141821] p-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6b4a]/15 text-[#ff6b4a]">
                <GraduationCap className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-base font-bold text-white">
                {selectedCourseTitle
                  ? `No assessments yet for ${selectedCourseTitle}`
                  : "No assessments available yet"}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#9ca7bc]">
                {selectedCourseTitle
                  ? "This course does not have an adaptive quiz attached yet. Select another course from the filter above or manage curriculum content in Instructor Studio."
                  : "There are no published adaptive quizzes matching this view. Check back after adding assessments or courses in Instructor Studio."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {courseFilter !== "all" ? (
                  <button
                    type="button"
                    onClick={() => handleCourseFilterChange("all")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#ff6b4a]/20 transition hover:brightness-110"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>View All Courses</span>
                  </button>
                ) : null}
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3548] bg-[#0f131b] px-4 py-2 text-xs font-semibold text-[#cbd4e4] transition hover:border-[#ff6b4a]/60 hover:text-white"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#ff6b4a]" />
                  <span>Open Instructor Studio</span>
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
