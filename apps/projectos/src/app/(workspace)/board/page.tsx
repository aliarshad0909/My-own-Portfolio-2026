"use client";

import { useCallback, useEffect, useState, type DragEvent, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  GripVertical,
  Link2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import {
  PRIORITY_META,
  STAGE_META,
  TASK_PRIORITIES,
  TASK_STAGES,
  type TaskPriority,
  type TaskStage,
} from "@/lib/constants";
import type { TaskBlockerInfo } from "@/lib/analytics";

type BoardTask = {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string;
  stage: TaskStage;
  priority: TaskPriority;
  assigneeName: string;
  dependsOnTaskId: string | null;
  estimatedHours: number;
  dueDate: string;
  attachmentName: string;
  projectCode: string;
  projectName: string;
  milestoneTitle: string | null;
  commentCount: number;
  blocker: TaskBlockerInfo;
};

type ProjectOption = { id: string; code: string; name: string };
type MilestoneOption = { id: string; projectId: string; title: string };
type MemberOption = { id: string; name: string; roleTitle: string };
type CommentItem = { id: string; taskId: string; authorName: string; body: string; createdAt: string };

export default function KanbanBoardPage() {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [milestones, setMilestones] = useState<MilestoneOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // HTML5 Drag-and-Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<TaskStage | null>(null);

  // Create Task Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectId, setNewProjectId] = useState("");
  const [newMilestoneId, setNewMilestoneId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newStage, setNewStage] = useState<TaskStage>("todo");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDependsOn, setNewDependsOn] = useState("");
  const [newEstHours, setNewEstHours] = useState("6");
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
  });
  const [newAttachment, setNewAttachment] = useState("");
  const [creating, setCreating] = useState(false);

  // Task Detail Drawer (Comments & Attachment Metadata)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [attachmentDraft, setAttachmentDraft] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load Kanban tasks.");
      const json = (await res.json()) as {
        tasks: BoardTask[];
        projects: ProjectOption[];
        milestones: MilestoneOption[];
        teamMembers: MemberOption[];
      };
      setTasks(json.tasks);
      setProjects(json.projects);
      setMilestones(json.milestones);
      setMembers(json.teamMembers);
      setNewProjectId((prev) => prev || json.projects[0]?.id || "");
      setNewAssignee((prev) => prev || json.teamMembers[0]?.name || "Morgan Ellis");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  const openTaskDrawer = useCallback(async (task: BoardTask) => {
    setActiveTaskId(task.id);
    setAttachmentDraft(task.attachmentName);
    setComments([]);
    const res = await fetch(`/api/tasks/${task.id}/comments`, { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { comments: CommentItem[] };
      setComments(json.comments);
    }
  }, []);

  const moveTaskToStage = useCallback(
    async (taskId: string, nextStage: TaskStage) => {
      const existing = tasks.find((t) => t.id === taskId);
      if (!existing || existing.stage === nextStage) return;

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, stage: nextStage } : t)));
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      if (!res.ok) {
        setError("Failed to update task stage.");
      }
      await load();
    },
    [tasks, load],
  );

  function handleDragStart(e: DragEvent<HTMLDivElement>, taskId: string) {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>, stage: TaskStage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) setDragOverStage(stage);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>, stage: TaskStage) {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverStage(null);
    if (droppedId) {
      void moveTaskToStage(droppedId, stage);
    }
  }

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newProjectId,
          milestoneId: newMilestoneId || null,
          title: newTitle,
          description: newDesc,
          stage: newStage,
          priority: newPriority,
          assigneeName: newAssignee,
          dependsOnTaskId: newDependsOn || null,
          estimatedHours: Number(newEstHours),
          dueDate: newDueDate,
          attachmentName: newAttachment,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Could not create task.");
      } else {
        setShowCreate(false);
        setNewTitle("");
        setNewDesc("");
        setNewDependsOn("");
        setNewAttachment("");
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handlePostComment(e: FormEvent) {
    e.preventDefault();
    if (!activeTask || !commentBody.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/tasks/${activeTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      if (res.ok) {
        const json = (await res.json()) as { comment: CommentItem };
        setComments((prev) => [...prev, json.comment]);
        setCommentBody("");
        await load();
      }
    } finally {
      setPostingComment(false);
    }
  }

  async function handleSaveAttachment() {
    if (!activeTask) return;
    setSavingMeta(true);
    try {
      await fetch(`/api/tasks/${activeTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentName: attachmentDraft.trim() }),
      });
      await load();
    } finally {
      setSavingMeta(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setActiveTaskId(null);
    await load();
  }

  const filteredTasks = tasks.filter((t) => {
    if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const projectMilestones = milestones.filter((m) => m.projectId === newProjectId);
  const projectTasksForDep = tasks.filter((t) => t.projectId === newProjectId);

  return (
    <div className="space-y-5 min-w-0">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#7c3aed]">
            Execution Workflow
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#18181b] mt-1">
            Interactive Kanban Board
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Drag cards across stages or use accessible arrows. Prerequisite dependencies surface
            live blocker warnings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-xl border border-[#e6e6ee] bg-white px-3 py-2 text-xs font-medium text-[#18181b] focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="all">All Projects ({tasks.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-[#e6e6ee] bg-white px-3 py-2 text-xs font-medium text-[#18181b] focus:outline-none focus:border-[#7c3aed]"
          >
            <option value="all">All Priorities</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium px-4 py-2.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Kanban Columns (horizontally scrollable inside wrapper so page never overflows viewport) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 animate-pulse">
          {TASK_STAGES.map((s) => (
            <div key={s} className="h-96 bg-white rounded-2xl border border-[#e6e6ee]" />
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 min-w-0">
            {TASK_STAGES.map((stage, stageIndex) => {
              const meta = STAGE_META[stage];
              const columnTasks = filteredTasks.filter((t) => t.stage === stage);
              const isDropTarget = dragOverStage === stage;
              return (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={() => setDragOverStage(null)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`rounded-2xl border p-3 flex flex-col min-h-[420px] transition-colors ${
                    isDropTarget
                      ? "border-[#7c3aed] bg-violet-50/70 ring-2 ring-[#8b5cf6]/25"
                      : `border-[#e6e6ee] ${meta.columnBg}`
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-zinc-200/70">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.dotColor }}
                      />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-[#18181b] truncate">
                        {meta.label}
                      </h2>
                    </div>
                    <span className="rounded-full bg-white border border-[#e6e6ee] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-zinc-600">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5 flex-1">
                    {columnTasks.map((task) => {
                      const priMeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
                      const prevStage = stageIndex > 0 ? TASK_STAGES[stageIndex - 1] : null;
                      const nextStage =
                        stageIndex < TASK_STAGES.length - 1 ? TASK_STAGES[stageIndex + 1] : null;
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverStage(null);
                          }}
                          className={`group rounded-xl bg-white border p-3 shadow-xs transition-all cursor-grab active:cursor-grabbing ${
                            draggedTaskId === task.id
                              ? "opacity-50 border-[#7c3aed]"
                              : "border-[#e6e6ee] hover:border-[#8b5cf6]/70"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <GripVertical className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 shrink-0" />
                              <span className="font-mono text-[10px] font-semibold text-[#7c3aed]">
                                {task.projectCode}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${priMeta.badgeClass}`}
                            >
                              {priMeta.label}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => void openTaskDrawer(task)}
                            className="mt-2 text-left text-xs font-semibold text-[#18181b] hover:text-[#7c3aed] leading-snug block w-full cursor-pointer"
                          >
                            {task.title}
                          </button>

                          {/* Dependency Blocker Warning Badge */}
                          {task.blocker.isBlocked && (
                            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] text-amber-800 flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                              <span className="leading-tight">
                                Blocked by <strong>{task.blocker.prerequisiteTitle}</strong>
                              </span>
                            </div>
                          )}

                          {/* Attachment metadata pill */}
                          {task.attachmentName && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 max-w-full">
                              <Paperclip className="h-3 w-3 shrink-0 text-zinc-400" />
                              <span className="truncate">{task.attachmentName}</span>
                            </div>
                          )}

                          {/* Footer: Assignee, comments, accessible move arrows */}
                          <div className="mt-3 pt-2 border-t border-[#f2f2f7] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 text-[11px] text-zinc-500">
                              <span className="truncate font-medium text-zinc-700">
                                {task.assigneeName.split(" ")[0]}
                              </span>
                              <span className="inline-flex items-center gap-0.5 tabular-nums">
                                <MessageSquare className="h-3 w-3" />
                                {task.commentCount}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {prevStage && (
                                <button
                                  type="button"
                                  onClick={() => void moveTaskToStage(task.id, prevStage)}
                                  title={`Move to ${STAGE_META[prevStage].label}`}
                                  aria-label={`Move ${task.title} to ${STAGE_META[prevStage].label}`}
                                  className="p-1 rounded-md border border-[#e6e6ee] text-zinc-500 hover:text-[#7c3aed] hover:border-[#7c3aed] cursor-pointer"
                                >
                                  <ArrowLeft className="h-3 w-3" />
                                </button>
                              )}
                              {nextStage && (
                                <button
                                  type="button"
                                  onClick={() => void moveTaskToStage(task.id, nextStage)}
                                  title={`Move to ${STAGE_META[nextStage].label}`}
                                  aria-label={`Move ${task.title} to ${STAGE_META[nextStage].label}`}
                                  className="p-1 rounded-md border border-[#e6e6ee] text-zinc-500 hover:text-[#7c3aed] hover:border-[#7c3aed] cursor-pointer"
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {columnTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-zinc-300/80 py-8 text-center text-[11px] text-zinc-400">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Slide-Over Task Detail Drawer (Comments, Dependency & Attachment Metadata) */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setActiveTaskId(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#e6e6ee] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#ececf4] flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#7c3aed]">
                    {activeTask.projectCode}
                  </span>
                  <span className="text-xs text-zinc-500">{activeTask.projectName}</span>
                </div>
                <h2 className="text-lg font-semibold text-[#18181b] mt-1">{activeTask.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskId(null)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTask.blocker.isBlocked && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Dependency Blocker Active</div>
                    <p className="mt-0.5">
                      Prerequisite task <strong>{activeTask.blocker.prerequisiteTitle}</strong> is
                      currently in{" "}
                      <strong>
                        {STAGE_META[activeTask.blocker.prerequisiteStage as TaskStage]?.label ??
                          activeTask.blocker.prerequisiteStage}
                      </strong>
                      . Complete it to clear this blocker.
                    </p>
                  </div>
                </div>
              )}

              {activeTask.description && (
                <p className="text-sm text-zinc-600 leading-relaxed">{activeTask.description}</p>
              )}

              {/* Quick Stage & Meta Grid */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-3.5 text-xs">
                <div>
                  <label className="text-zinc-500 block mb-1">Stage</label>
                  <select
                    value={activeTask.stage}
                    onChange={(e) =>
                      void moveTaskToStage(activeTask.id, e.target.value as TaskStage)
                    }
                    className="w-full rounded-lg border border-[#e6e6ee] bg-white px-2.5 py-1.5 font-medium text-[#18181b]"
                  >
                    {TASK_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Assignee</div>
                  <div className="font-medium text-[#18181b] py-1.5">{activeTask.assigneeName}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Due Date
                  </div>
                  <div className="font-medium text-[#18181b] tabular-nums">
                    {activeTask.dueDate || "Unscheduled"}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Estimate</div>
                  <div className="font-medium text-[#18181b] tabular-nums">
                    {activeTask.estimatedHours}h
                  </div>
                </div>
              </div>

              {/* Attachment Metadata Editor */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#18181b] flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-[#7c3aed]" />
                  Deliverable Attachment Metadata
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attachmentDraft}
                    onChange={(e) => setAttachmentDraft(e.target.value)}
                    placeholder="e.g. architecture-spec-v2.pdf"
                    className="flex-1 rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSaveAttachment()}
                    disabled={savingMeta}
                    className="rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white px-3 py-2 text-xs font-medium cursor-pointer disabled:opacity-60"
                  >
                    {savingMeta ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {/* Comments Thread */}
              <div className="space-y-3 pt-2 border-t border-[#ececf4]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#7c3aed]" />
                    Team Comments ({comments.length})
                  </h3>
                  <span className="text-[11px] text-zinc-400">Hidden from Client Portal</span>
                </div>

                <div className="space-y-2.5">
                  {comments.length === 0 ? (
                    <div className="text-xs text-zinc-400 py-3">
                      No comments yet. Start the discussion below.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl bg-[#f8f8fb] border border-[#ececf4] p-3 text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#18181b]">{c.authorName}</div>
                        <p className="text-zinc-600 leading-relaxed">{c.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={(e) => void handlePostComment(e)} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    placeholder="Add an internal update or review note..."
                    className="flex-1 rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs text-[#18181b] focus:outline-none focus:border-[#7c3aed]"
                  />
                  <button
                    type="submit"
                    disabled={postingComment}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3.5 py-2 text-xs font-medium cursor-pointer disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-[#ececf4] flex items-center justify-between bg-[#fafafe]">
              <button
                type="button"
                onClick={() => void handleDeleteTask(activeTask.id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Task
              </button>
              <button
                type="button"
                onClick={() => setActiveTaskId(null)}
                className="rounded-xl border border-[#e6e6ee] bg-white px-4 py-1.5 text-xs font-medium text-[#18181b] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#e6e6ee] shadow-2xl w-full max-w-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#18181b]">Create Kanban Task</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateTask(e)} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Project</label>
                  <select
                    required
                    value={newProjectId}
                    onChange={(e) => {
                      setNewProjectId(e.target.value);
                      setNewMilestoneId("");
                      setNewDependsOn("");
                    }}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Milestone (Optional)
                  </label>
                  <select
                    value={newMilestoneId}
                    onChange={(e) => setNewMilestoneId(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  >
                    <option value="">No milestone linked</option>
                    {projectMilestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Task Title</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-sm"
                  placeholder="Implement OAuth token rotation handler"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  placeholder="Acceptance criteria and implementation notes..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Assignee</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as TaskStage)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  >
                    {TASK_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_META[s].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_META[p].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                    <Link2 className="h-3 w-3 text-[#7c3aed]" />
                    Depends On Task (Blocker)
                  </label>
                  <select
                    value={newDependsOn}
                    onChange={(e) => setNewDependsOn(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  >
                    <option value="">No prerequisite dependency</option>
                    {projectTasksForDep.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{STAGE_META[t.stage].shortLabel}] {t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-[#7c3aed]" />
                    Attachment Filename
                  </label>
                  <input
                    value={newAttachment}
                    onChange={(e) => setNewAttachment(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                    placeholder="e.g. api-contract-v1.yaml"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-xl border border-[#e6e6ee] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-[#e6e6ee] px-4 py-2 text-xs font-medium text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 text-xs font-medium cursor-pointer disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
