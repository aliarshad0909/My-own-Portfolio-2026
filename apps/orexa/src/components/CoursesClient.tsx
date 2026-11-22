"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  FileCode2,
  FileText,
  FolderOpen,
  GraduationCap,
  Search,
  Sparkles,
  Video,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import type { DifficultyTier, ResourceKind } from "@/db/schema";
import type { CourseCatalogItem, CourseLessonView } from "@/lib/queries";

type Props = {
  initialCourses: CourseCatalogItem[];
  initialCourseId?: string;
  initialLessonId?: string;
};

function tierBadge(tier: DifficultyTier) {
  if (tier === "advanced") return "border-violet-500/35 bg-violet-500/15 text-violet-200";
  if (tier === "intermediate") return "border-amber-500/35 bg-amber-500/15 text-amber-200";
  return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
}

function ResourceIcon({ kind }: { kind: ResourceKind }) {
  if (kind === "cheatsheet") return <FileCode2 className="h-4 w-4 text-amber-400" />;
  if (kind === "exercise") return <Sparkles className="h-4 w-4 text-[#ff6b4a]" />;
  if (kind === "video_notes") return <Video className="h-4 w-4 text-sky-400" />;
  return <FileText className="h-4 w-4 text-emerald-400" />;
}

export function CoursesClient({ initialCourses, initialCourseId, initialLessonId }: Props) {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseCatalogItem[]>(initialCourses);
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    if (initialCourseId && initialCourses.some((c) => c.id === initialCourseId)) {
      return initialCourseId;
    }
    return initialCourses[0]?.id ?? "";
  });

  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => {
    const startCourse =
      initialCourses.find((c) => c.id === initialCourseId) ?? initialCourses[0];
    if (!startCourse) return "";
    if (initialLessonId) {
      const exists = startCourse.modules.some((m) =>
        m.lessons.some((l) => l.id === initialLessonId),
      );
      if (exists) return initialLessonId;
    }
    return startCourse.nextLesson?.id ?? startCourse.modules[0]?.lessons[0]?.id ?? "";
  });

  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);

  useEffect(() => {
    const onRefresh = async () => {
      const res = await fetch("/api/courses", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { courses: CourseCatalogItem[] };
        setCourses(data.courses);
      }
    };
    window.addEventListener("orexa:refresh", onRefresh);
    return () => window.removeEventListener("orexa:refresh", onRefresh);
  }, []);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [courses, search, difficultyFilter]);

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? filteredCourses[0] ?? courses[0] ?? null,
    [courses, filteredCourses, selectedCourseId],
  );

  const flatLessons = useMemo(() => {
    if (!activeCourse) return [] as Array<CourseLessonView & { moduleTitle: string }>;
    return activeCourse.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleTitle: m.title })),
    );
  }, [activeCourse]);

  const activeLesson = useMemo(() => {
    return flatLessons.find((l) => l.id === selectedLessonId) ?? flatLessons[0] ?? null;
  }, [flatLessons, selectedLessonId]);

  const activeIndex = activeLesson ? flatLessons.findIndex((l) => l.id === activeLesson.id) : -1;
  const prevLesson = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex >= 0 && activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;

  function selectCourse(course: CourseCatalogItem) {
    setSelectedCourseId(course.id);
    const firstTarget = course.nextLesson?.id ?? course.modules[0]?.lessons[0]?.id ?? "";
    setSelectedLessonId(firstTarget);
  }

  async function toggleLessonComplete(lesson: CourseLessonView) {
    setBusyLessonId(lesson.id);
    const nextState = !lesson.completed;
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextState }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to update lesson progress.", "error");
        return;
      }

      const refreshed = await fetch("/api/courses", { cache: "no-store" });
      if (refreshed.ok) {
        const data = (await refreshed.json()) as { courses: CourseCatalogItem[] };
        setCourses(data.courses);
      }

      toast(
        nextState
          ? `Marked "${lesson.title}" complete — progress synced to PostgreSQL.`
          : `Marked "${lesson.title}" as in progress.`,
        "success",
      );
    } finally {
      setBusyLessonId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + Search / Filter */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[#242b3a] bg-[#141821] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Courses, Modules &amp; Interactive Lessons</h1>
          <p className="mt-1 text-xs text-[#9ca7bc]">
            Explore published syllabi, read interactive lessons, mark progress in PostgreSQL, and inspect study resources.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#7e8a9f]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] py-2 pr-3 pl-8 text-xs text-white placeholder-[#64748b] focus:border-[#ff6b4a] focus:outline-none"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            aria-label="Filter by difficulty"
            className="rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs font-medium text-[#e2e8f0] focus:border-[#ff6b4a] focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="foundation">Foundation</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </section>

      {/* Course Selector Strip */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filteredCourses.map((course) => {
          const selected = activeCourse?.id === course.id;
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => selectCourse(course)}
              className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                selected
                  ? "border-[#ff6b4a] bg-[#191d28] shadow-lg shadow-[#ff6b4a]/10"
                  : "border-[#242b3a] bg-[#141821] hover:border-[#37425b]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-medium text-[#9ca7bc]">{course.category}</span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize ${tierBadge(course.difficulty)}`}
                  >
                    {course.difficulty}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-white">{course.title}</p>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-[#9ca7bc]">
                  <span>
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                  <span className="font-semibold text-white">{course.completionPct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#0d0f14]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#f97316]"
                    style={{ width: `${course.completionPct}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </section>

      {activeCourse ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Modules & Lessons Accordion + Study Resources */}
          <aside className="space-y-5 lg:col-span-4">
            <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#222838] pb-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-[#ff6b4a]" />
                  <h2 className="text-sm font-bold text-white">Course Syllabus</h2>
                </div>
                <span className="text-xs font-semibold text-[#ff8a6f]">{activeCourse.completionPct}% done</span>
              </div>

              <div className="mt-3 space-y-2.5">
                {activeCourse.modules.map((mod) => {
                  const collapsed = Boolean(collapsedModules[mod.id]);
                  return (
                    <div key={mod.id} className="overflow-hidden rounded-xl border border-[#242c3e] bg-[#0f131b]">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                        }
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-[#161c28]"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {collapsed ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-[#8d99ae]" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-[#ff6b4a]" />
                          )}
                          <span className="truncate text-xs font-bold text-white">{mod.title}</span>
                        </div>
                        <span className="shrink-0 text-[11px] text-[#8d99ae]">
                          {mod.completedCount}/{mod.totalCount}
                        </span>
                      </button>

                      {!collapsed ? (
                        <div className="divide-y divide-[#1e2433] border-t border-[#1e2433]">
                          {mod.lessons.map((lesson) => {
                            const isSelected = activeLesson?.id === lesson.id;
                            return (
                              <button
                                key={lesson.id}
                                type="button"
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-xs transition ${
                                  isSelected
                                    ? "bg-[#ff6b4a]/15 text-white"
                                    : "text-[#b6c0d2] hover:bg-[#161c28] hover:text-white"
                                }`}
                              >
                                {lesson.completed ? (
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                                ) : (
                                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#5b667c]" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium leading-snug">{lesson.title}</p>
                                  <p className="mt-0.5 text-[11px] text-[#7e8a9f]">
                                    {lesson.durationMins} min
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Study Resources Panel */}
            <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4">
              <div className="flex items-center justify-between border-b border-[#222838] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#ff6b4a]" />
                  <h2 className="text-sm font-bold text-white">Study Resources</h2>
                </div>
                <span className="text-xs text-[#8d99ae]">{activeCourse.resources.length} items</span>
              </div>

              {activeCourse.resources.length === 0 ? (
                <p className="mt-3 text-xs text-[#8d99ae]">No study resources attached to this course yet.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {activeCourse.resources.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-xl border border-[#242c3e] bg-[#0f131b] p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0">
                          <ResourceIcon kind={res.kind} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-white">{res.title}</p>
                            <span className="rounded bg-[#1a202d] px-1.5 py-0.5 text-[10px] uppercase text-[#9ca7bc]">
                              {res.kind.replace("_", " ")}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#9ca7bc]">
                            {res.summary}
                          </p>
                          <p className="mt-1.5 truncate font-mono text-[10px] text-[#ff8a6f]">
                            {res.urlOrRef}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Right: Interactive Lesson Reader */}
          <section className="space-y-5 lg:col-span-8">
            {activeLesson ? (
              <article className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#222838] pb-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#9ca7bc]">
                      <span className="font-semibold text-[#ff8a6f]">{activeCourse.title}</span>
                      <span>·</span>
                      <span>{activeLesson.moduleTitle}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {activeLesson.title}
                    </h2>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-[#8d99ae]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-[#ff6b4a]" />
                        {activeLesson.durationMins} min read
                      </span>
                      <span>Instructor: {activeCourse.instructorName}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          activeLesson.completed
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-[#1e2433] text-[#cbd4e4]"
                        }`}
                      >
                        {activeLesson.completed ? "Completed" : "In Progress"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busyLessonId === activeLesson.id}
                    onClick={() => toggleLessonComplete(activeLesson)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:opacity-60 ${
                      activeLesson.completed
                        ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                        : "bg-gradient-to-r from-[#ff6b4a] to-[#f97316] text-white shadow-md shadow-[#ff6b4a]/20 hover:brightness-110"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {busyLessonId === activeLesson.id
                        ? "Saving…"
                        : activeLesson.completed
                          ? "Completed ✓"
                          : "Mark Lesson Complete"}
                    </span>
                  </button>
                </div>

                {/* Lesson Body */}
                <div className="mt-6">
                  <MarkdownRenderer content={activeLesson.contentMd} />
                </div>

                {/* Key Takeaways */}
                {activeLesson.keyTakeaways.length > 0 ? (
                  <div className="mt-7 rounded-2xl border border-[#ff6b4a]/30 bg-[#18151b] p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#ff8a6f] uppercase">
                      <Sparkles className="h-3.5 w-3.5 text-[#ff6b4a]" />
                      <span>Key Takeaways</span>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-[#e2e8f0]">
                      {activeLesson.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b4a]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Lesson Footer Actions: Prev/Next + Ask Tutor / Take Quiz */}
                <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#222838] pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={!prevLesson}
                      onClick={() => prevLesson && setSelectedLessonId(prevLesson.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3548] bg-[#0f131b] px-3 py-2 text-xs font-semibold text-[#cbd4e4] hover:border-[#ff6b4a]/60 disabled:opacity-40"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </button>
                    <button
                      type="button"
                      disabled={!nextLesson}
                      onClick={() => nextLesson && setSelectedLessonId(nextLesson.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3548] bg-[#0f131b] px-3 py-2 text-xs font-semibold text-[#cbd4e4] hover:border-[#ff6b4a]/60 disabled:opacity-40"
                    >
                      <span>Next Lesson</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tutor?course=${activeCourse.id}&lesson=${activeLesson.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#ff6b4a]/40 bg-[#ff6b4a]/10 px-3 py-2 text-xs font-semibold text-[#ffb4a2] hover:bg-[#ff6b4a]/20"
                    >
                      <Bot className="h-3.5 w-3.5 text-[#ff6b4a]" />
                      <span>Discuss with AI Tutor</span>
                    </Link>
                    <Link
                      href={`/assessments?course=${activeCourse.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#2d3548] bg-[#1a202d] px-3 py-2 text-xs font-semibold text-white hover:border-[#ff6b4a]/60"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-[#ff6b4a]" />
                      <span>Test Mastery</span>
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#2d3548] bg-[#141821] p-10 text-center text-sm text-[#9ca7bc]">
                This course has no lessons yet. Create or generate a lesson in Instructor Studio.
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
