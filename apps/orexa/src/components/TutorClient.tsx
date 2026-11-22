"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Bot,
  Cpu,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import type { CourseCatalogItem, TutorMessageView } from "@/lib/queries";
import {
  extractTutorSelectionHint,
  reconcileTutorSelection,
  type TutorSelectionHint,
} from "@/lib/tutor-state";

type Props = {
  courses: CourseCatalogItem[];
  initialCourseId: string;
  initialLessonId?: string;
  initialMessages: TutorMessageView[];
  engineMode: "deterministic" | "llm";
};

const QUICK_PROMPTS = [
  "Summarize the key takeaways from this course.",
  "How should I design chunking or indexing invariants in production?",
  "Give me a quick self-check prompt to verify I'm ready for the quiz.",
  "What are the top pitfalls to avoid in this module?",
];

type TutorSelectionState = {
  courseId: string;
  lessonId: string;
  hint: TutorSelectionHint;
};

function buildInitialSelection(
  courses: CourseCatalogItem[],
  initialCourseId: string,
  initialLessonId?: string,
): TutorSelectionState {
  const reconciled = reconcileTutorSelection(courses, initialCourseId, initialLessonId ?? "");
  return {
    courseId: reconciled.courseId,
    lessonId: reconciled.lessonId,
    hint: extractTutorSelectionHint(courses, reconciled.courseId, reconciled.lessonId),
  };
}

export function TutorClient({
  courses,
  initialCourseId,
  initialLessonId,
  initialMessages,
  engineMode,
}: Props) {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CourseCatalogItem[]>(courses);
  const [prevCoursesProp, setPrevCoursesProp] = useState<CourseCatalogItem[]>(courses);
  const [selection, setSelection] = useState<TutorSelectionState>(() =>
    buildInitialSelection(courses, initialCourseId, initialLessonId),
  );
  const [messages, setMessages] = useState<TutorMessageView[]>(initialMessages);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  if (courses !== prevCoursesProp) {
    setPrevCoursesProp(courses);
    setCatalog(courses);
    const reconciled = reconcileTutorSelection(
      courses,
      selection.courseId,
      selection.lessonId,
      selection.hint,
    );
    const nextHint = extractTutorSelectionHint(courses, reconciled.courseId, reconciled.lessonId);
    if (
      reconciled.courseChanged ||
      reconciled.lessonChanged ||
      nextHint.courseSlug !== selection.hint.courseSlug ||
      nextHint.courseTitle !== selection.hint.courseTitle ||
      nextHint.lessonTitle !== selection.hint.lessonTitle
    ) {
      setSelection({
        courseId: reconciled.courseId,
        lessonId: reconciled.lessonId,
        hint: nextHint,
      });
    }
  }

  const reconciledSelection = useMemo(
    () =>
      reconcileTutorSelection(catalog, selection.courseId, selection.lessonId, selection.hint),
    [catalog, selection],
  );
  const courseId = reconciledSelection.courseId;
  const lessonId = reconciledSelection.lessonId;

  const selectionRef = useRef<TutorSelectionState>(selection);
  const loadedCourseIdRef = useRef<string>(
    buildInitialSelection(courses, initialCourseId, initialLessonId).courseId,
  );
  const requestSeqRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    selectionRef.current = {
      courseId,
      lessonId,
      hint: selection.hint,
    };
  }, [courseId, lessonId, selection.hint]);

  useEffect(() => {
    return () => {
      activeAbortRef.current?.abort();
    };
  }, []);

  const activeCourse = useMemo(
    () => catalog.find((c) => c.id === courseId) ?? null,
    [catalog, courseId],
  );

  const courseLessons = useMemo(() => {
    if (!activeCourse) return [];
    return activeCourse.modules.flatMap((m) =>
      m.lessons.map((l) => ({ id: l.id, title: l.title, moduleTitle: m.title })),
    );
  }, [activeCourse]);

  const loadThreadForCourse = useCallback(async (targetCourseId: string) => {
    const seq = ++requestSeqRef.current;
    activeAbortRef.current?.abort();
    const controller = new AbortController();
    activeAbortRef.current = controller;
    loadedCourseIdRef.current = targetCourseId;

    if (!targetCourseId) {
      setMessages([]);
      setLoadingThread(false);
      return;
    }

    setLoadingThread(true);
    try {
      const res = await fetch(`/api/tutor?courseId=${encodeURIComponent(targetCourseId)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok || seq !== requestSeqRef.current || controller.signal.aborted) {
        return;
      }
      const data = (await res.json()) as { messages: TutorMessageView[] };
      setMessages(data.messages);
    } catch (error) {
      if ((error as { name?: string })?.name !== "AbortError") {
        toast("Unable to load tutor conversation history.", "error");
      }
    } finally {
      if (seq === requestSeqRef.current) {
        setLoadingThread(false);
      }
    }
  }, [toast]);

  // Reload the conversation thread whenever reconciliation updates the active courseId
  // (e.g., after router.refresh() replaces course UUIDs following a demo workspace reset).
  useEffect(() => {
    if (loadedCourseIdRef.current === courseId) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        void loadThreadForCourse(courseId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [courseId, loadThreadForCourse]);

  // On workspace reset/refresh events, fetch the latest course catalog first and
  // reconcile courseId/lessonId before fetching thread messages so stale deleted
  // IDs are never queried or submitted.
  useEffect(() => {
    const onRefresh = async () => {
      const seq = ++requestSeqRef.current;
      activeAbortRef.current?.abort();
      const controller = new AbortController();
      activeAbortRef.current = controller;

      setLoadingThread(true);
      try {
        const coursesRes = await fetch("/api/courses", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!coursesRes.ok || seq !== requestSeqRef.current || controller.signal.aborted) {
          return;
        }

        const coursesPayload = (await coursesRes.json()) as { courses: CourseCatalogItem[] };
        const freshCourses = Array.isArray(coursesPayload.courses) ? coursesPayload.courses : [];
        const current = selectionRef.current;
        const reconciled = reconcileTutorSelection(
          freshCourses,
          current.courseId,
          current.lessonId,
          current.hint,
        );
        const nextHint = extractTutorSelectionHint(
          freshCourses,
          reconciled.courseId,
          reconciled.lessonId,
        );

        loadedCourseIdRef.current = reconciled.courseId;
        setCatalog(freshCourses);
        setSelection({
          courseId: reconciled.courseId,
          lessonId: reconciled.lessonId,
          hint: nextHint,
        });

        if (!reconciled.courseId) {
          setMessages([]);
          return;
        }

        const threadRes = await fetch(
          `/api/tutor?courseId=${encodeURIComponent(reconciled.courseId)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        if (!threadRes.ok || seq !== requestSeqRef.current || controller.signal.aborted) {
          return;
        }

        const threadPayload = (await threadRes.json()) as { messages: TutorMessageView[] };
        setMessages(threadPayload.messages);
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          toast("Unable to refresh tutor conversation.", "error");
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoadingThread(false);
        }
      }
    };

    window.addEventListener("orexa:refresh", onRefresh);
    return () => window.removeEventListener("orexa:refresh", onRefresh);
  }, [toast]);

  async function handleSelectCourse(nextCourseId: string) {
    const reconciled = reconcileTutorSelection(catalog, nextCourseId, "");
    const nextHint = extractTutorSelectionHint(catalog, reconciled.courseId, "");
    setSelection({
      courseId: reconciled.courseId,
      lessonId: "",
      hint: nextHint,
    });
    await loadThreadForCourse(reconciled.courseId);
  }

  function handleSelectLesson(nextLessonId: string) {
    const reconciled = reconcileTutorSelection(catalog, courseId, nextLessonId);
    const nextHint = extractTutorSelectionHint(catalog, reconciled.courseId, reconciled.lessonId);
    setSelection({
      courseId: reconciled.courseId,
      lessonId: reconciled.lessonId,
      hint: nextHint,
    });
  }

  async function sendQuestion(questionText: string) {
    const trimmed = questionText.trim();
    if (!trimmed || !courseId || loadingThread) return;

    const targetCourseId = courseId;
    const targetLessonId = lessonId || null;

    setSending(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: targetCourseId,
          lessonId: targetLessonId,
          message: trimmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Unable to get tutor reply.", "error");
        return;
      }

      if (selectionRef.current.courseId === targetCourseId) {
        setMessages((prev) => [...prev, data.studentMessage, data.tutorMessage]);
      }
      setPrompt("");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await sendQuestion(prompt);
  }

  async function handleClearThread() {
    if (!courseId || loadingThread) return;
    const targetCourseId = courseId;
    const res = await fetch(`/api/tutor?courseId=${encodeURIComponent(targetCourseId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      if (selectionRef.current.courseId === targetCourseId) {
        setMessages([]);
      }
      toast("Cleared tutor conversation thread for this course.", "info");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-2xl border border-[#242b3a] bg-[#141821] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 px-3 py-1 text-xs font-semibold text-[#ffb4a2]">
            <Cpu className="h-3.5 w-3.5 text-[#ff6b4a]" />
            <span>
              Engine Mode:{" "}
              {engineMode === "llm"
                ? "Server-Side LLM + Deterministic Fallback"
                : "Deterministic Curriculum-Grounded Engine (Zero API Keys)"}
            </span>
          </div>
          <h1 className="mt-2.5 text-xl font-bold text-white sm:text-2xl">
            Curriculum-Grounded AI Tutor
          </h1>
          <p className="mt-1 text-xs text-[#9ca7bc]">
            Select any course to ask questions grounded directly in PostgreSQL lesson content, key takeaways,
            and study resources. Full threads persist automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearThread}
          disabled={messages.length === 0 || loadingThread || !courseId}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl border border-[#2d3548] bg-[#0f131b] px-3 py-2 text-xs font-semibold text-[#cbd4e4] hover:border-red-500/50 hover:text-red-300 disabled:opacity-40 lg:self-auto"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Thread</span>
        </button>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Grounding Context Controls */}
        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-[#242b3a] bg-[#141821] p-4 space-y-4">
            <div>
              <label htmlFor="tutor-course" className="block text-xs font-bold text-white">
                Active Course Context
              </label>
              <select
                id="tutor-course"
                value={courseId}
                onChange={(e) => handleSelectCourse(e.target.value)}
                disabled={catalog.length === 0}
                className="mt-1.5 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs font-medium text-white focus:border-[#ff6b4a] focus:outline-none disabled:opacity-50"
              >
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tutor-lesson" className="block text-xs font-bold text-white">
                Optional Lesson Focus
              </label>
              <select
                id="tutor-lesson"
                value={lessonId}
                onChange={(e) => handleSelectLesson(e.target.value)}
                disabled={!activeCourse}
                className="mt-1.5 w-full rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3 py-2 text-xs font-medium text-[#cbd4e4] focus:border-[#ff6b4a] focus:outline-none disabled:opacity-50"
              >
                <option value="">Entire Course Syllabus ({courseLessons.length} lessons)</option>
                {courseLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            {activeCourse ? (
              <div className="rounded-xl border border-[#242c3e] bg-[#0f131b] p-3.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <BookOpen className="h-3.5 w-3.5 text-[#ff6b4a]" />
                  <span>Indexed Syllabus Scope</span>
                </div>
                <p className="mt-1.5 leading-relaxed text-[#9ca7bc]">{activeCourse.description}</p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-[#cbd4e4]">
                  <span className="rounded bg-[#1a202d] px-2 py-0.5">
                    {activeCourse.modules.length} modules
                  </span>
                  <span className="rounded bg-[#1a202d] px-2 py-0.5">
                    {activeCourse.totalLessons} lessons
                  </span>
                  <span className="rounded bg-[#1a202d] px-2 py-0.5">
                    {activeCourse.resources.length} resources
                  </span>
                </div>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-bold text-white">Suggested Prompts</p>
              <div className="mt-2 space-y-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={sending || loadingThread || !courseId}
                    onClick={() => sendQuestion(q)}
                    className="flex w-full items-start gap-2 rounded-xl border border-[#262e40] bg-[#0f131b] px-3 py-2 text-left text-xs text-[#cbd4e4] transition hover:border-[#ff6b4a]/60 hover:text-white disabled:opacity-50"
                  >
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff6b4a]" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Persisted Chat Thread */}
        <section className="flex min-h-[540px] flex-col rounded-2xl border border-[#242b3a] bg-[#141821] lg:col-span-8">
          <div className="flex items-center justify-between border-b border-[#222838] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff6b4a]/15 text-[#ff6b4a]">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Orexa Syllabus Tutor</p>
                <p className="text-[11px] text-[#8d99ae]">
                  {activeCourse?.title ?? "Select a course"} · Persisted in PostgreSQL
                </p>
              </div>
            </div>
            <span className="rounded-full border border-[#2d3548] bg-[#0f131b] px-2.5 py-1 text-[11px] text-[#9ca7bc]">
              {messages.length} message{messages.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {loadingThread ? (
              <p className="text-center text-xs text-[#8d99ae]">Loading conversation history…</p>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#2d3548] bg-[#0f131b] p-6 text-center">
                <Bot className="mx-auto h-7 w-7 text-[#ff6b4a]" />
                <p className="mt-2 text-sm font-bold text-white">Start a Syllabus-Grounded Session</p>
                <p className="mt-1 text-xs text-[#9ca7bc]">
                  Ask a concept question, request a summary, or click a suggested prompt on the left.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "student" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "tutor" ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ff6b4a]/15 text-[#ff6b4a]">
                      <Bot className="h-4 w-4" />
                    </span>
                  ) : null}

                  <div
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
                      msg.role === "student"
                        ? "border-[#ff6b4a]/40 bg-[#ff6b4a]/15 text-sm text-white"
                        : "border-[#262e40] bg-[#0f131b]"
                    }`}
                  >
                    {msg.role === "student" ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-[#222838] pb-2 text-[10px] uppercase tracking-wider text-[#8d99ae]">
                          <span className="font-semibold text-[#ff8a6f]">Orexa Tutor</span>
                          <span>Mode: {msg.mode}</span>
                        </div>
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    )}
                  </div>

                  {msg.role === "student" ? (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1f2636] text-[#cbd4e4]">
                      <User className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2.5 border-t border-[#222838] bg-[#10131b] p-4"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ask about ${activeCourse?.title ?? "this course"}…`}
              aria-label="Ask the Orexa AI Tutor"
              className="min-w-0 flex-1 rounded-xl border border-[#2d3548] bg-[#0d0f14] px-3.5 py-2.5 text-sm text-white placeholder-[#64748b] focus:border-[#ff6b4a] focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || loadingThread || !courseId || !prompt.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff6b4a] to-[#f97316] px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-[#ff6b4a]/20 transition hover:brightness-110 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sending ? "Thinking…" : "Ask Tutor"}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
