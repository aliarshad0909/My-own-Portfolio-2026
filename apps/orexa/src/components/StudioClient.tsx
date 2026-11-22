"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BarChart3,
  BookPlus,
  FilePlus2,
  FolderPlus,
  Library,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { DifficultyTier, ResourceKind } from "@/db/schema";
import type { CourseCatalogItem, StudioAnalyticsData } from "@/lib/queries";

type StudioTab = "curriculum" | "generator" | "resources" | "analytics";

type Props = {
  initialData: {
    catalog: CourseCatalogItem[];
    analytics: StudioAnalyticsData;
  };
};

export function StudioClient({ initialData }: Props) {
  const { toast } = useToast();
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState<StudioTab>("curriculum");

  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialData.catalog[0]?.id ?? "",
  );

  // Course creation form
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("AI Engineering");
  const [courseDifficulty, setCourseDifficulty] = useState<DifficultyTier>("intermediate");
  const [courseInstructor, setCourseInstructor] = useState("Dr. Kavita Patel");
  const [courseDescription, setCourseDescription] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Module creation form
  const [moduleTitle, setModuleTitle] = useState("");
  const [creatingModule, setCreatingModule] = useState(false);

  // Direct lesson creation form
  const [lessonModuleId, setLessonModuleId] = useState(
    initialData.catalog[0]?.modules[0]?.id ?? "",
  );
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState(15);
  const [lessonContent, setLessonContent] = useState("");
  const [lessonTakeaways, setLessonTakeaways] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  // Deterministic AI-Assisted Lesson Outline Generator state
  const [genTopic, setGenTopic] = useState("");
  const [genDifficulty, setGenDifficulty] = useState<DifficultyTier>("intermediate");
  const [genDuration, setGenDuration] = useState(18);
  const [genGoal, setGenGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDuration, setDraftDuration] = useState(18);
  const [draftContent, setDraftContent] = useState("");
  const [draftTakeaways, setDraftTakeaways] = useState("");
  const [draftModuleId, setDraftModuleId] = useState(
    initialData.catalog[0]?.modules[0]?.id ?? "",
  );

  // Resource creation form
  const [resTitle, setResTitle] = useState("");
  const [resKind, setResKind] = useState<ResourceKind>("guide");
  const [resSummary, setResSummary] = useState("");
  const [resUrl, setResUrl] = useState("orexa://guides/");
  const [savingResource, setSavingResource] = useState(false);

  async function reloadStudio() {
    const res = await fetch("/api/studio", { cache: "no-store" });
    if (res.ok) {
      const next = (await res.json()) as {
        catalog: CourseCatalogItem[];
        analytics: StudioAnalyticsData;
      };
      setData(next);
    }
  }

  useEffect(() => {
    const onRefresh = () => {
      void reloadStudio();
    };
    window.addEventListener("orexa:refresh", onRefresh);
    return () => window.removeEventListener("orexa:refresh", onRefresh);
  }, []);

  const selectedCourse = useMemo(
    () => data.catalog.find((c) => c.id === selectedCourseId) ?? data.catalog[0] ?? null,
    [data.catalog, selectedCourseId],
  );

  const effectiveLessonModuleId = useMemo(() => {
    if (!selectedCourse) return "";
    if (selectedCourse.modules.some((m) => m.id === lessonModuleId)) return lessonModuleId;
    return selectedCourse.modules[0]?.id ?? "";
  }, [selectedCourse, lessonModuleId]);

  const effectiveDraftModuleId = useMemo(() => {
    if (!selectedCourse) return "";
    if (selectedCourse.modules.some((m) => m.id === draftModuleId)) return draftModuleId;
    return selectedCourse.modules[0]?.id ?? "";
  }, [selectedCourse, draftModuleId]);

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    setCreatingCourse(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseTitle,
          category: courseCategory,
          difficulty: courseDifficulty,
          instructorName: courseInstructor,
          description: courseDescription,
          published: true,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to create course.", "error");
        return;
      }
      setCourseTitle("");
      setCourseDescription("");
      setSelectedCourseId(payload.course.id);
      await reloadStudio();
      toast(`Created course "${payload.course.title}" in PostgreSQL.`, "success");
    } finally {
      setCreatingCourse(false);
    }
  }

  async function handleDeleteCourse(id: string, title: string) {
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast("Unable to delete course.", "error");
      return;
    }
    await reloadStudio();
    toast(`Deleted course "${title}".`, "info");
  }

  async function handleCreateModule(e: FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    setCreatingModule(true);
    try {
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourse.id, title: moduleTitle }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to add module.", "error");
        return;
      }
      setModuleTitle("");
      setLessonModuleId(payload.module.id);
      setDraftModuleId(payload.module.id);
      await reloadStudio();
      toast(`Added module "${payload.module.title}".`, "success");
    } finally {
      setCreatingModule(false);
    }
  }

  async function handleCreateLesson(e: FormEvent) {
    e.preventDefault();
    if (!effectiveLessonModuleId) {
      toast("Create a module first before adding a lesson.", "error");
      return;
    }
    setSavingLesson(true);
    try {
      const takeaways = lessonTakeaways
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: effectiveLessonModuleId,
          title: lessonTitle,
          durationMins: Number(lessonDuration),
          contentMd: lessonContent,
          keyTakeaways: takeaways.length > 0 ? takeaways : [`Apply ${lessonTitle} in practice.`],
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to save lesson.", "error");
        return;
      }
      setLessonTitle("");
      setLessonContent("");
      setLessonTakeaways("");
      await reloadStudio();
      toast(`Saved lesson "${payload.lesson.title}" to PostgreSQL.`, "success");
    } finally {
      setSavingLesson(false);
    }
  }

  async function handleDeleteLesson(id: string) {
    const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
    if (res.ok) {
      await reloadStudio();
      toast("Deleted lesson.", "info");
    }
  }

  async function handleGenerateOutline(e: FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/studio/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          topic: genTopic,
          difficulty: genDifficulty,
          durationMins: Number(genDuration),
          learningGoal: genGoal,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to generate outline.", "error");
        return;
      }
      setDraftTitle(payload.draft.title);
      setDraftDuration(payload.draft.durationMins);
      setDraftContent(payload.draft.contentMd);
      setDraftTakeaways((payload.draft.keyTakeaways as string[]).join("\n"));
      toast("Generated deterministic lesson draft — edit and save to PostgreSQL.", "success");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveGeneratedDraft() {
    if (!effectiveDraftModuleId) {
      toast("Select or create a module first.", "error");
      return;
    }
    setSavingLesson(true);
    try {
      const takeaways = draftTakeaways
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: effectiveDraftModuleId,
          title: draftTitle,
          durationMins: Number(draftDuration),
          contentMd: draftContent,
          keyTakeaways: takeaways.length > 0 ? takeaways : [`Master ${draftTitle}`],
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to publish generated lesson.", "error");
        return;
      }
      await reloadStudio();
      toast(`Published "${payload.lesson.title}" into ${selectedCourse?.title ?? "course"}!`, "success");
    } finally {
      setSavingLesson(false);
    }
  }

  async function handleCreateResource(e: FormEvent) {
    e.preventDefault();
    if (!selectedCourse) return;
    setSavingResource(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          title: resTitle,
          kind: resKind,
          summary: resSummary,
          urlOrRef: resUrl,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(payload.error || "Unable to save study resource.", "error");
        return;
      }
      setResTitle("");
      setResSummary("");
      setResUrl("orexa://guides/");
      await reloadStudio();
      toast(`Added resource "${payload.resource.title}".`, "success");
    } finally {
      setSavingResource(false);
    }
  }

  async function handleDeleteResource(id: string) {
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) {
      await reloadStudio();
      toast("Deleted study resource.", "info");
    }
  }

  const tabs: Array<{ id: StudioTab; label: string; icon: typeof BookPlus }> = [
    { id: "curriculum", label: "Course & Lesson Authoring", icon: BookPlus },
    { id: "generator", label: "AI Outline Generator", icon: Wand2 },
    { id: "resources", label: "Study Resources CRUD", icon: Library },
    { id: "analytics", label: "Admin Learning Analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <section className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#ff6b4a] uppercase">
              Instructor &amp; Admin Workspace
            </p>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
              Orexa Curriculum Studio &amp; Cohort Analytics
            </h1>
            <p className="mt-1 text-xs text-[#9ca7bc]">
              Author courses, modules, lessons &amp; resources in PostgreSQL, draft structured outlines
              deterministically, and monitor learner mastery across all tracks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="studio-course-select" className="text-xs font-semibold text-[#9ca7bc]">
              Active Course:
            </label>
            <select
              id="studio-course-select"
              value={selectedCourse?.id ?? ""}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs font-semibold text-white focus:border-[#ff6b4a] focus:outline-none"
            >
              {data.catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#222838] pt-4">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-[#ff6b4a] to-[#f97316] text-white shadow-sm"
                    : "border border-[#2a3245] bg-[#0f131b] text-[#cbd4e4] hover:border-[#ff6b4a]/60 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: Course, Module & Lesson Authoring CRUD */}
      {tab === "curriculum" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left: Create Course + Existing Courses */}
          <div className="space-y-5 xl:col-span-5">
            <form
              onSubmit={handleCreateCourse}
              className="space-y-3.5 rounded-2xl border border-[#242b3a] bg-[#141821] p-5"
            >
              <div className="flex items-center gap-2">
                <BookPlus className="h-4 w-4 text-[#ff6b4a]" />
                <h2 className="text-sm font-bold text-white">Create New Course</h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cbd4e4]">Course Title</label>
                <input
                  required
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Distributed Systems Reliability"
                  className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#cbd4e4]">Category</label>
                  <input
                    required
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#cbd4e4]">Difficulty</label>
                  <select
                    value={courseDifficulty}
                    onChange={(e) => setCourseDifficulty(e.target.value as DifficultyTier)}
                    className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                  >
                    <option value="foundation">Foundation</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cbd4e4]">Instructor Name</label>
                <input
                  required
                  value={courseInstructor}
                  onChange={(e) => setCourseInstructor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#cbd4e4]">Description</label>
                <textarea
                  required
                  rows={2}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  placeholder="Outline the skills learners will master in this track..."
                  className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={creatingCourse}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{creatingCourse ? "Creating…" : "Create Course"}</span>
              </button>
            </form>

            {/* Course List */}
            <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5">
              <h2 className="text-sm font-bold text-white">Published Catalog ({data.catalog.length})</h2>
              <div className="mt-3 space-y-2">
                {data.catalog.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                      selectedCourse?.id === c.id
                        ? "border-[#ff6b4a] bg-[#1a1f2c]"
                        : "border-[#242c3e] bg-[#0f131b]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCourseId(c.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-xs font-bold text-white">{c.title}</p>
                      <p className="text-[11px] text-[#8d99ae]">
                        {c.modules.length} modules · {c.totalLessons} lessons · {c.difficulty}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(c.id, c.title)}
                      aria-label={`Delete ${c.title}`}
                      className="rounded-lg p-1.5 text-[#8d99ae] hover:bg-red-500/15 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Add Module & Add Lesson for Selected Course */}
          <div className="space-y-5 xl:col-span-7">
            {selectedCourse ? (
              <>
                <form
                  onSubmit={handleCreateModule}
                  className="flex flex-col gap-3 rounded-2xl border border-[#242b3a] bg-[#141821] p-5 sm:flex-row sm:items-end"
                >
                  <div className="min-w-0 flex-1">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <FolderPlus className="h-3.5 w-3.5 text-[#ff6b4a]" />
                      <span>Add Module to {selectedCourse.title}</span>
                    </label>
                    <input
                      required
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="e.g., Module 3: Production Deployment Patterns"
                      className="mt-1.5 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingModule}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#ff6b4a]/50 bg-[#ff6b4a]/15 px-4 py-2 text-xs font-semibold text-[#ffb4a2] hover:bg-[#ff6b4a]/25 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{creatingModule ? "Adding…" : "Add Module"}</span>
                  </button>
                </form>

                <form
                  onSubmit={handleCreateLesson}
                  className="space-y-3.5 rounded-2xl border border-[#242b3a] bg-[#141821] p-5"
                >
                  <div className="flex items-center gap-2">
                    <FilePlus2 className="h-4 w-4 text-[#ff6b4a]" />
                    <h2 className="text-sm font-bold text-white">Author New Lesson</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-[#cbd4e4]">Target Module</label>
                      <select
                        value={effectiveLessonModuleId}
                        onChange={(e) => setLessonModuleId(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                      >
                        {selectedCourse.modules.length === 0 ? (
                          <option value="">No modules yet — add a module above</option>
                        ) : (
                          selectedCourse.modules.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#cbd4e4]">Duration (min)</label>
                      <input
                        type="number"
                        min={2}
                        max={180}
                        value={lessonDuration}
                        onChange={(e) => setLessonDuration(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#cbd4e4]">Lesson Title</label>
                    <input
                      required
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="e.g., Idempotent Webhook Processing"
                      className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#cbd4e4]">
                      Lesson Markdown Content
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={lessonContent}
                      onChange={(e) => setLessonContent(e.target.value)}
                      placeholder="## Overview&#10;Write structured lesson notes in Markdown..."
                      className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 font-mono text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#cbd4e4]">
                      Key Takeaways (one per line)
                    </label>
                    <textarea
                      rows={2}
                      value={lessonTakeaways}
                      onChange={(e) => setLessonTakeaways(e.target.value)}
                      placeholder="Verify webhook signatures before parsing payload&#10;Deduplicate events with unique constraint"
                      className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingLesson || !effectiveLessonModuleId}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>{savingLesson ? "Saving…" : "Save Lesson to PostgreSQL"}</span>
                  </button>
                </form>

                {/* Existing Modules & Lessons */}
                <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5">
                  <h2 className="text-sm font-bold text-white">
                    Existing Structure — {selectedCourse.title}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {selectedCourse.modules.map((mod) => (
                      <div
                        key={mod.id}
                        className="rounded-xl border border-[#242c3e] bg-[#0f131b] p-3.5"
                      >
                        <p className="text-xs font-bold text-[#ff8a6f]">{mod.title}</p>
                        <div className="mt-2 space-y-1.5">
                          {mod.lessons.map((l) => (
                            <div
                              key={l.id}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#141821] px-3 py-2 text-xs"
                            >
                              <span className="truncate text-[#e2e8f0]">
                                {l.title}{" "}
                                <span className="text-[#7e8a9f]">({l.durationMins}m)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(l.id)}
                                aria-label={`Delete ${l.title}`}
                                className="text-[#8d99ae] hover:text-red-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* TAB 2: Deterministic AI-Assisted Lesson Outline Generator */}
      {tab === "generator" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form
            onSubmit={handleGenerateOutline}
            className="space-y-4 rounded-2xl border border-[#242b3a] bg-[#141821] p-5 xl:col-span-5"
          >
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[#ff6b4a]" />
              <h2 className="text-sm font-bold text-white">
                Deterministic Lesson Outline Generator
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-[#9ca7bc]">
              Generate a structured Markdown lesson draft and key takeaways locally with zero paid API keys.
              Review and edit the draft on the right, then publish directly into PostgreSQL.
            </p>

            <div>
              <label className="block text-xs font-medium text-[#cbd4e4]">Lesson Topic</label>
              <input
                required
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder="e.g., Semantic Caching & Citation Verification"
                className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#cbd4e4]">Target Tier</label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value as DifficultyTier)}
                  className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                >
                  <option value="foundation">Foundation</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#cbd4e4]">Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={genDuration}
                  onChange={(e) => setGenDuration(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cbd4e4]">
                Learning Goal (optional)
              </label>
              <textarea
                rows={2}
                value={genGoal}
                onChange={(e) => setGenGoal(e.target.value)}
                placeholder="What should students be able to build or evaluate after this lesson?"
                className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating || !selectedCourse}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{generating ? "Generating Draft…" : "Generate Lesson Outline"}</span>
            </button>
          </form>

          <div className="space-y-4 rounded-2xl border border-[#242b3a] bg-[#141821] p-5 xl:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white">Editable Draft Preview</h2>
              <span className="rounded-full border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#ffb4a2]">
                Human-in-the-Loop Gate
              </span>
            </div>

            {!draftTitle ? (
              <div className="rounded-xl border border-dashed border-[#2d3548] bg-[#0f131b] p-8 text-center text-xs text-[#8d99ae]">
                Enter a topic on the left and click <strong>Generate Lesson Outline</strong> to create
                an editable draft ready to publish into PostgreSQL.
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#cbd4e4]">
                      Publish Into Module
                    </label>
                    <select
                      value={effectiveDraftModuleId}
                      onChange={(e) => setDraftModuleId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                    >
                      {selectedCourse?.modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#cbd4e4]">Duration (min)</label>
                    <input
                      type="number"
                      min={2}
                      max={180}
                      value={draftDuration}
                      onChange={(e) => setDraftDuration(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#cbd4e4]">Draft Title</label>
                  <input
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs font-semibold text-white focus:border-[#ff6b4a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#cbd4e4]">
                    Editable Markdown Content
                  </label>
                  <textarea
                    rows={8}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 font-mono text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#cbd4e4]">
                    Key Takeaways (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={draftTakeaways}
                    onChange={(e) => setDraftTakeaways(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={savingLesson || !effectiveDraftModuleId}
                  onClick={handleSaveGeneratedDraft}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingLesson ? "Publishing…" : "Publish Draft to PostgreSQL"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* TAB 3: Study Resources Management CRUD */}
      {tab === "resources" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form
            onSubmit={handleCreateResource}
            className="space-y-3.5 rounded-2xl border border-[#242b3a] bg-[#141821] p-5 xl:col-span-5"
          >
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-[#ff6b4a]" />
              <h2 className="text-sm font-bold text-white">Attach Study Resource</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cbd4e4]">Resource Title</label>
              <input
                required
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="e.g., Retrieval Latency Benchmark Cheatsheet"
                className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cbd4e4]">Resource Kind</label>
              <select
                value={resKind}
                onChange={(e) => setResKind(e.target.value as ResourceKind)}
                className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
              >
                <option value="guide">Guide</option>
                <option value="cheatsheet">Cheatsheet</option>
                <option value="exercise">Exercise</option>
                <option value="video_notes">Video Notes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cbd4e4]">Summary</label>
              <textarea
                required
                rows={2}
                value={resSummary}
                onChange={(e) => setResSummary(e.target.value)}
                placeholder="Describe what learners get from this resource..."
                className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#cbd4e4]">Reference / URL</label>
              <input
                required
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 font-mono text-xs text-white focus:border-[#ff6b4a] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingResource || !selectedCourse}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{savingResource ? "Saving…" : "Save Resource"}</span>
            </button>
          </form>

          <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5 xl:col-span-7">
            <h2 className="text-sm font-bold text-white">
              Resources for {selectedCourse?.title ?? "Selected Course"} (
              {selectedCourse?.resources.length ?? 0})
            </h2>
            <div className="mt-3 space-y-2.5">
              {selectedCourse?.resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-[#242c3e] bg-[#0f131b] p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">{r.title}</span>
                      <span className="rounded bg-[#1a202d] px-1.5 py-0.5 text-[10px] uppercase text-[#ff8a6f]">
                        {r.kind.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#9ca7bc]">{r.summary}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-[#7e8a9f]">
                      {r.urlOrRef}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteResource(r.id)}
                    aria-label={`Delete resource ${r.title}`}
                    className="rounded-lg p-1.5 text-[#8d99ae] hover:bg-red-500/15 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 4: Admin Learning Analytics Overview */}
      {tab === "analytics" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Cohort Completion Rate",
                value: `${data.analytics.summary.overallCohortCompletionPct}%`,
                sub: `${data.analytics.summary.totalLearners} enrolled learners`,
              },
              {
                label: "Avg Assessment Score",
                value: `${data.analytics.summary.avgAssessmentScorePct}%`,
                sub: `${data.analytics.summary.totalQuizAttempts} graded attempts`,
              },
              {
                label: "Published Curriculum",
                value: `${data.analytics.summary.totalLessons} lessons`,
                sub: `${data.analytics.summary.totalCourses} courses · ${data.analytics.summary.totalResources} resources`,
              },
              {
                label: "AI Tutor Interactions",
                value: `${data.analytics.summary.totalTutorMessages}`,
                sub: "Persisted grounded messages",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4"
              >
                <p className="text-xs font-medium text-[#9ca7bc]">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                <p className="mt-1 text-xs text-[#8d99ae]">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Course Performance Table */}
            <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5 xl:col-span-7">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#ff6b4a]" />
                <h2 className="text-sm font-bold text-white">Course Completion &amp; Quiz Mastery</h2>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#222838] text-[#8d99ae]">
                      <th className="pb-2.5 font-semibold">Course</th>
                      <th className="pb-2.5 font-semibold">Lessons</th>
                      <th className="pb-2.5 font-semibold">Cohort Completion</th>
                      <th className="pb-2.5 font-semibold">Avg Quiz Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2433]">
                    {data.analytics.coursePerformance.map((cp) => (
                      <tr key={cp.courseId}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-white">{cp.title}</p>
                          <p className="text-[11px] text-[#8d99ae]">
                            {cp.category} · {cp.difficulty}
                          </p>
                        </td>
                        <td className="py-3 pr-3 text-[#cbd4e4]">{cp.lessonCount}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#0d0f14]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#ff6b4a] to-[#f97316]"
                                style={{ width: `${cp.avgCompletionPct}%` }}
                              />
                            </div>
                            <span className="font-semibold text-white">{cp.avgCompletionPct}%</span>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-emerald-300">
                          {cp.avgQuizScorePct !== null
                            ? `${cp.avgQuizScorePct}% (${cp.attemptCount})`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Learner Readiness Breakdown */}
            <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-5 xl:col-span-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#ff6b4a]" />
                <h2 className="text-sm font-bold text-white">Learner Readiness Breakdown</h2>
              </div>

              <div className="mt-4 space-y-2.5">
                {data.analytics.learnerBreakdown.map((learner) => (
                  <div
                    key={learner.userId}
                    className="rounded-xl border border-[#242c3e] bg-[#0f131b] p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">{learner.name}</p>
                        <p className="truncate text-[11px] text-[#8d99ae]">{learner.email}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ffb4a2]">
                        {learner.readinessLabel}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#cbd4e4]">
                      <span>
                        Completion: <strong>{learner.completionPct}%</strong> ({learner.completedLessons} lessons)
                      </span>
                      <span>
                        Quiz Avg:{" "}
                        <strong>
                          {learner.avgQuizScorePct !== null ? `${learner.avgQuizScorePct}%` : "—"}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
