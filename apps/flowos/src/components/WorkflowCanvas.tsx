"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  Bot,
  Clock,
  GitBranch,
  Globe,
  Play,
  Plus,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";
import {
  NODE_TYPE_META,
  type ConditionOperator,
  type FlowEdge,
  type FlowNode,
  type FlowNodeConfig,
  type FlowNodeData,
  type FlowNodeType,
} from "@/lib/types";
import { RunStatusBadge } from "@/components/StatusBadge";

type WorkflowRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  active: boolean;
  isTemplate: boolean;
  nodesJson: FlowNode[];
  edgesJson: FlowEdge[];
  samplePayload: Record<string, unknown>;
};

const NODE_ICONS: Record<FlowNodeType, React.ComponentType<{ className?: string }>> = {
  trigger: Zap,
  schedule: Clock,
  webhook: Webhook,
  condition: GitBranch,
  transform: SlidersHorizontal,
  ai_process: Bot,
  human_approval: ShieldAlert,
  http_request: Globe,
};

function FlowNodeCard({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  const nodeType = data.nodeType || "trigger";
  const meta = NODE_TYPE_META[nodeType] || NODE_TYPE_META.trigger;
  const Icon = NODE_ICONS[nodeType] || Zap;
  const isTrigger = nodeType === "trigger" || nodeType === "schedule" || nodeType === "webhook";
  const isCondition = nodeType === "condition";
  const isApproval = nodeType === "human_approval";

  return (
    <div
      className={`w-[235px] rounded-2xl bg-white border-2 transition shadow-md ${
        selected
          ? "border-[#7c3aed] shadow-violet-500/20 ring-2 ring-[#7c3aed]/20"
          : isApproval
            ? "border-amber-400"
            : "border-[#dfd9f2]"
      }`}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-[#0c0a16] !border-2 !border-white"
        />
      )}

      <div
        className="px-3 py-2 rounded-t-[14px] flex items-center justify-between gap-2 text-white"
        style={{ backgroundColor: isApproval ? "#0c0a16" : "#0c0a16" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: meta.accent }}
          >
            <Icon className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider truncate">
            {meta.shortLabel}
          </span>
        </div>
        {isApproval && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
            GATE
          </span>
        )}
      </div>

      <div className="p-3">
        <div className="text-xs font-bold text-[#141024] truncate">{data.label}</div>
        {data.description && (
          <p className="text-[11px] text-[#645d80] mt-1 line-clamp-2 leading-snug">
            {data.description}
          </p>
        )}
        {nodeType === "condition" && data.config?.field && (
          <div className="mt-2 font-mono text-[10px] bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-2 py-1 truncate">
            {data.config.field} {data.config.operator || ">="} {String(data.config.value ?? "")}
          </div>
        )}
        {nodeType === "http_request" && data.config?.url && (
          <div className="mt-2 font-mono text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md px-2 py-1 truncate">
            {data.config.method || "POST"} {data.config.url}
          </div>
        )}
      </div>

      {isCondition ? (
        <>
          <Handle
            type="source"
            id="true"
            position={Position.Right}
            style={{ top: "38%" }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white"
          />
          <Handle
            type="source"
            id="false"
            position={Position.Right}
            style={{ top: "74%" }}
            className="!w-3 !h-3 !bg-rose-500 !border-2 !border-white"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-[#7c3aed] !border-2 !border-white"
        />
      )}
    </div>
  );
}

const ALL_NODE_TYPES: FlowNodeType[] = [
  "trigger",
  "schedule",
  "webhook",
  "condition",
  "transform",
  "ai_process",
  "human_approval",
  "http_request",
];

function defaultConfigFor(nodeType: FlowNodeType): FlowNodeConfig {
  switch (nodeType) {
    case "trigger":
      return { eventName: "manual.event" };
    case "schedule":
      return { cron: "0 9 * * *", timezone: "UTC" };
    case "webhook":
      return { webhookPath: "/hooks/custom", secretHeader: "x-flowos-sig" };
    case "condition":
      return { field: "ai.score", operator: ">=", value: 70 };
    case "transform":
      return {
        mappings: { summary: "ai.draftMessage" },
        template: "Processed event for {{payload.company}}",
      };
    case "ai_process":
      return {
        task: "custom",
        systemPrompt: "Score payload priority and generate structured action draft.",
      };
    case "human_approval":
      return {
        approvalPrompt: "Verify AI draft before allowing outbound dispatch.",
        approverRole: "Operations Lead",
        channelPreview: "External Action (Sandbox)",
      };
    case "http_request":
      return {
        method: "POST",
        url: "https://hooks.flowos.studio/sandbox/action",
        sandbox: true,
        integrationKind: "http",
      };
  }
}

export function WorkflowCanvas({ initialWorkflowId }: { initialWorkflowId?: string }) {
  const router = useRouter();
  const [workflowList, setWorkflowList] = useState<WorkflowRecord[]>([]);
  const [activeWf, setActiveWf] = useState<WorkflowRecord | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Test Run Modal state
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [payloadText, setPayloadText] = useState("{}");
  const [lastRunResult, setLastRunResult] = useState<{ id: string; status: string } | null>(null);

  // Create New Workflow Modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const nodeCounterRef = useRef(1);
  const rfInstanceRef = useRef<ReactFlowInstance<Node<FlowNodeData>, Edge> | null>(null);

  const nodeTypes = useMemo(() => ({ flowNode: FlowNodeCard }), []);

  const hydrateWorkflow = useCallback(
    (wf: WorkflowRecord) => {
      setActiveWf(wf);
      setNodes(
        (wf.nodesJson || []).map((n) => ({
          id: n.id,
          type: "flowNode",
          position: n.position || { x: 100, y: 120 },
          data: n.data,
        })),
      );
      setEdges(
        (wf.edgesJson || []).map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? undefined,
          targetHandle: e.targetHandle ?? undefined,
          label: e.label,
          animated: e.animated ?? true,
        })),
      );
      setPayloadText(JSON.stringify(wf.samplePayload || {}, null, 2));
      setSelectedNodeId(wf.nodesJson?.[0]?.id ?? null);
      window.setTimeout(() => {
        void rfInstanceRef.current?.fitView({ padding: 0.18, duration: 250 });
      }, 60);
    },
    [setEdges, setNodes],
  );

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { workflows: WorkflowRecord[] };
      setWorkflowList(json.workflows);
      const chosen =
        (initialWorkflowId && json.workflows.find((w) => w.id === initialWorkflowId)) ||
        json.workflows[0] ||
        null;
      if (chosen) hydrateWorkflow(chosen);
    } finally {
      setLoading(false);
    }
  }, [hydrateWorkflow, initialWorkflowId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkflows();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkflows]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            label:
              connection.sourceHandle === "true" || connection.sourceHandle === "false"
                ? connection.sourceHandle
                : undefined,
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  function addNode(nodeType: FlowNodeType) {
    const meta = NODE_TYPE_META[nodeType];
    const seq = nodeCounterRef.current++;
    const id = `n-${nodeType}-${nodes.length + seq}`;
    const maxX = nodes.reduce((acc, n) => Math.max(acc, n.position.x), 40);
    const newNode: Node<FlowNodeData> = {
      id,
      type: "flowNode",
      position: { x: Math.min(maxX + 260, 1400), y: 120 + (nodes.length % 3) * 70 },
      data: {
        label: meta.label,
        nodeType,
        description: meta.description,
        config: defaultConfigFor(nodeType),
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);
    setStatusMsg(`Added "${meta.label}" node — connect its handle and click Save.`);
  }

  function deleteSelectedNode() {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) =>
      prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
    );
    setSelectedNodeId(null);
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function updateSelectedNodeData(patch: Partial<FlowNodeData>) {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ...patch,
              },
            }
          : n,
      ),
    );
  }

  function updateSelectedConfig(patch: Partial<FlowNodeConfig>) {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              data: {
                ...n.data,
                config: {
                  ...(n.data.config || {}),
                  ...patch,
                },
              },
            }
          : n,
      ),
    );
  }

  async function handleSave(toggleActive?: boolean) {
    if (!activeWf) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const nextActive = toggleActive !== undefined ? toggleActive : activeWf.active;
      const res = await fetch(`/api/workflows/${activeWf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: activeWf.name,
          active: nextActive,
          nodesJson: nodes.map((n) => ({
            id: n.id,
            type: "flowNode",
            position: n.position,
            data: n.data,
          })),
          edgesJson: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? null,
            targetHandle: e.targetHandle ?? null,
            label: typeof e.label === "string" ? e.label : undefined,
            animated: e.animated ?? true,
          })),
        }),
      });
      const json = (await res.json()) as { workflow?: WorkflowRecord; error?: string };
      if (!res.ok || !json.workflow) {
        setStatusMsg(json.error || "Failed to save workflow.");
      } else {
        setActiveWf(json.workflow);
        setWorkflowList((prev) => prev.map((w) => (w.id === json.workflow!.id ? json.workflow! : w)));
        setStatusMsg("Workflow canvas saved to PostgreSQL.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRunWorkflow() {
    if (!activeWf) return;
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(payloadText || "{}") as Record<string, unknown>;
    } catch {
      setStatusMsg("Trigger payload must be valid JSON.");
      return;
    }

    setRunning(true);
    setStatusMsg(null);
    try {
      // Save latest canvas changes before running
      await handleSave();
      const res = await fetch(`/api/workflows/${activeWf.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsedPayload }),
      });
      const json = (await res.json()) as {
        run?: { id: string; status: string };
        error?: string;
      };
      if (!res.ok || !json.run) {
        setStatusMsg(json.error || "Run execution failed.");
      } else {
        setLastRunResult({ id: json.run.id, status: json.run.status });
        setRunModalOpen(false);
        setStatusMsg(
          json.run.status === "awaiting_approval"
            ? "Run paused at Human Approval Gate — inspect & approve in Runs."
            : `Workflow run finished with status: ${json.run.status}.`,
        );
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleCreateWorkflow(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDesc.trim() || "Custom visual automation workflow.",
      }),
    });
    const json = (await res.json()) as { workflow?: WorkflowRecord; error?: string };
    if (res.ok && json.workflow) {
      setWorkflowList((prev) => [json.workflow!, ...prev]);
      hydrateWorkflow(json.workflow);
      setNewModalOpen(false);
      setNewName("");
      setNewDesc("");
      router.replace(`/editor/${json.workflow.id}`);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-[#e5e1f2] p-10 text-center text-sm text-[#5b5575]">
        Loading Visual Workflow Canvas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Editor Controls Bar */}
      <div className="rounded-2xl bg-[#0c0a16] text-white border border-[#261f40] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <select
            aria-label="Select workflow"
            value={activeWf?.id || ""}
            onChange={(e) => {
              const found = workflowList.find((w) => w.id === e.target.value);
              if (found) {
                hydrateWorkflow(found);
                router.replace(`/editor/${found.id}`);
              }
            }}
            className="rounded-xl bg-[#18132d] border border-[#302752] text-white text-sm font-semibold px-3.5 py-2 max-w-full sm:max-w-[300px] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]"
          >
            {workflowList.map((wf) => (
              <option key={wf.id} value={wf.id}>
                {wf.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1c1633] hover:bg-[#282047] border border-[#342a59] text-xs font-semibold text-violet-200 px-3 py-2 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>

          {activeWf && (
            <button
              type="button"
              onClick={() => void handleSave(!activeWf.active)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition cursor-pointer ${
                activeWf.active
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-700/40 text-slate-300 border-slate-600"
              }`}
            >
              {activeWf.active ? "Active" : "Paused"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {lastRunResult && (
            <Link
              href={`/runs?runId=${lastRunResult.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#18132d] border border-[#332959] px-3 py-1.5 text-xs font-medium text-violet-200 hover:text-white"
            >
              <span>Last Run:</span>
              <RunStatusBadge status={lastRunResult.status} />
            </Link>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1c1633] hover:bg-[#2a214a] border border-[#352b5c] text-white text-xs font-semibold px-3.5 py-2 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Canvas"}
          </button>
          <button
            type="button"
            onClick={() => setRunModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold px-4 py-2 transition shadow-md shadow-violet-950/60 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" />
            Test Run
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl bg-[#f3efff] border border-[#d8c7fb] px-4 py-2.5 text-xs font-medium text-[#4c1d95] flex items-center justify-between gap-2">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="underline">
            Hide
          </button>
        </div>
      )}

      {/* Node Palette Strip */}
      <div className="rounded-2xl bg-white border border-[#e5e1f2] p-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#665f82] px-2">
          Add Node:
        </span>
        {ALL_NODE_TYPES.map((t) => {
          const meta = NODE_TYPE_META[t];
          const Icon = NODE_ICONS[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => addNode(t)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e1f2] hover:border-[#7c3aed] hover:bg-[#f6f2ff] px-2.5 py-1.5 text-xs font-semibold text-[#1e1836] transition cursor-pointer"
            >
              <span
                className="h-4 w-4 rounded flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: meta.accent }}
              >
                <Icon className="h-2.5 w-2.5" />
              </span>
              <span>{meta.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split: React Flow Canvas + Node Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 rounded-2xl bg-white border border-[#e5e1f2] overflow-hidden h-[540px] sm:h-[600px] relative shadow-xs">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              rfInstanceRef.current = instance;
              window.setTimeout(() => {
                void instance.fitView({ padding: 0.18 });
              }, 80);
            }}
            onNodeClick={(_ev, node) => setSelectedNodeId(node.id)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#d5cde8" />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const nt = (n.data as FlowNodeData)?.nodeType;
                return (nt && NODE_TYPE_META[nt]?.accent) || "#7c3aed";
              }}
              maskColor="rgba(12, 10, 22, 0.08)"
            />
          </ReactFlow>
        </div>

        {/* Node Inspector Panel */}
        <aside className="xl:col-span-4 rounded-2xl bg-white border border-[#e5e1f2] p-5 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#ece8f7]">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c3aed]">
                    {NODE_TYPE_META[selectedNode.data.nodeType]?.label || selectedNode.data.nodeType}
                  </span>
                  <h3 className="text-base font-bold text-[#141024] truncate">Node Inspector</h3>
                </div>
                <button
                  type="button"
                  onClick={deleteSelectedNode}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                  title="Remove node from canvas"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a3357] mb-1">
                  Node Label
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => updateSelectedNodeData({ label: e.target.value })}
                  className="w-full rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a3357] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={selectedNode.data.description || ""}
                  onChange={(e) => updateSelectedNodeData({ description: e.target.value })}
                  className="w-full rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30"
                />
              </div>

              {/* Type-specific Configuration Fields */}
              {selectedNode.data.nodeType === "condition" && (
                <div className="space-y-3 rounded-xl bg-amber-50/60 border border-amber-200 p-3.5">
                  <div className="text-xs font-bold text-amber-900">Condition Rule</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Dot-Path Field (e.g. ai.score, payload.stockQty)
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config.field || ""}
                      onChange={(e) => updateSelectedConfig({ field: e.target.value })}
                      className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Operator
                      </label>
                      <select
                        value={selectedNode.data.config.operator || ">="}
                        onChange={(e) =>
                          updateSelectedConfig({ operator: e.target.value as ConditionOperator })
                        }
                        className="w-full rounded-lg border border-amber-300 bg-white px-2 py-1.5 text-xs"
                      >
                        {[">=", ">", "<=", "<", "===", "!==", "contains", "exists"].map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        Compare Value
                      </label>
                      <input
                        type="text"
                        value={String(selectedNode.data.config.value ?? "")}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const num = Number(raw);
                          updateSelectedConfig({
                            value: raw !== "" && !Number.isNaN(num) ? num : raw,
                          });
                        }}
                        className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.nodeType === "transform" && (
                <div className="space-y-3 rounded-xl bg-teal-50/60 border border-teal-200 p-3.5">
                  <div className="text-xs font-bold text-teal-900">Transform Template</div>
                  <div>
                    <label className="block text-[11px] font-semibold text-teal-900 mb-1">
                      Summary Template (supports &#123;&#123;payload.*&#125;&#125; &amp; &#123;&#123;ai.*&#125;&#125;)
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNode.data.config.template || ""}
                      onChange={(e) => updateSelectedConfig({ template: e.target.value })}
                      className="w-full rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.nodeType === "ai_process" && (
                <div className="space-y-3 rounded-xl bg-violet-50/70 border border-violet-200 p-3.5">
                  <div className="text-xs font-bold text-violet-900">
                    Deterministic AI Engine (Zero API Key)
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-violet-900 mb-1">
                      Analysis Profile
                    </label>
                    <select
                      value={selectedNode.data.config.task || "custom"}
                      onChange={(e) =>
                        updateSelectedConfig({
                          task: e.target.value as FlowNodeConfig["task"],
                        })
                      }
                      className="w-full rounded-lg border border-violet-300 bg-white px-2.5 py-1.5 text-xs"
                    >
                      <option value="lead_scoring">Lead Qualification &amp; Outreach Draft</option>
                      <option value="ticket_triage">Support Ticket SLA Triage</option>
                      <option value="invoice_escalation">Overdue Invoice Escalation</option>
                      <option value="inventory_analysis">Inventory Replenishment Brief</option>
                      <option value="custom">Custom Deterministic Summary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-violet-900 mb-1">
                      Instruction Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNode.data.config.systemPrompt || ""}
                      onChange={(e) => updateSelectedConfig({ systemPrompt: e.target.value })}
                      className="w-full rounded-lg border border-violet-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.nodeType === "human_approval" && (
                <div className="space-y-3 rounded-xl bg-[#0c0a16] text-white border border-amber-400/40 p-3.5">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Mandatory Safety Gate
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Operator Review Prompt
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNode.data.config.approvalPrompt || ""}
                      onChange={(e) => updateSelectedConfig({ approvalPrompt: e.target.value })}
                      className="w-full rounded-lg border border-[#342a59] bg-[#18132d] text-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Approver Role
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config.approverRole || ""}
                      onChange={(e) => updateSelectedConfig({ approverRole: e.target.value })}
                      className="w-full rounded-lg border border-[#342a59] bg-[#18132d] text-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.nodeType === "http_request" && (
                <div className="space-y-3 rounded-xl bg-emerald-50/70 border border-emerald-200 p-3.5">
                  <div className="text-xs font-bold text-emerald-900">
                    HTTP / Webhook Dispatch (Sandbox Safe)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={selectedNode.data.config.method || "POST"}
                      onChange={(e) =>
                        updateSelectedConfig({
                          method: e.target.value as FlowNodeConfig["method"],
                        })
                      }
                      className="rounded-lg border border-emerald-300 bg-white px-2 py-1.5 text-xs font-semibold"
                    >
                      {["POST", "PUT", "PATCH", "GET"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={selectedNode.data.config.url || ""}
                      onChange={(e) => updateSelectedConfig({ url: e.target.value })}
                      className="col-span-2 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                      placeholder="https://hooks.flowos.studio/sandbox/..."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-emerald-900">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedNode.data.config.simulateFailure)}
                      onChange={(e) =>
                        updateSelectedConfig({ simulateFailure: e.target.checked })
                      }
                    />
                    Simulate 503 failure (for testing Retry)
                  </label>
                </div>
              )}

              {(selectedNode.data.nodeType === "schedule" ||
                selectedNode.data.nodeType === "webhook" ||
                selectedNode.data.nodeType === "trigger") && (
                <div className="space-y-2 rounded-xl bg-[#f7f6fb] border border-[#e5e1f2] p-3.5">
                  <div className="text-xs font-bold text-[#141024]">Trigger Configuration</div>
                  {selectedNode.data.nodeType === "schedule" && (
                    <input
                      type="text"
                      value={selectedNode.data.config.cron || "0 * * * *"}
                      onChange={(e) => updateSelectedConfig({ cron: e.target.value })}
                      className="w-full rounded-lg border border-[#dad4ec] bg-white px-2.5 py-1.5 font-mono text-xs"
                      placeholder="0 * * * *"
                    />
                  )}
                  {selectedNode.data.nodeType === "webhook" && (
                    <input
                      type="text"
                      value={selectedNode.data.config.webhookPath || "/hooks/inbound"}
                      onChange={(e) => updateSelectedConfig({ webhookPath: e.target.value })}
                      className="w-full rounded-lg border border-[#dad4ec] bg-white px-2.5 py-1.5 font-mono text-xs"
                    />
                  )}
                  {selectedNode.data.nodeType === "trigger" && (
                    <input
                      type="text"
                      value={selectedNode.data.config.eventName || "manual.trigger"}
                      onChange={(e) => updateSelectedConfig({ eventName: e.target.value })}
                      className="w-full rounded-lg border border-[#dad4ec] bg-white px-2.5 py-1.5 font-mono text-xs"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[#665f82]">
              Select any node on the canvas to inspect or edit its parameters.
            </div>
          )}

          <div className="mt-5 pt-3 border-t border-[#ece8f7] text-[11px] text-[#6b6487]">
            Tip: Drag from a right purple handle to a left dark handle to wire nodes. Condition
            nodes provide green (true) and red (false) branch outputs.
          </div>
        </aside>
      </div>

      {/* Test Run Modal */}
      {runModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#e5e1f2] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141024]">Execute Test Run</h3>
              <button
                type="button"
                onClick={() => setRunModalOpen(false)}
                className="text-xs font-semibold text-[#5b5575] hover:text-[#141024]"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-[#5b5575]">
              Supply a JSON trigger payload. Any Human Approval node will pause execution cleanly
              in <code className="font-mono text-amber-700">awaiting_approval</code>.
            </p>
            <textarea
              rows={9}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full rounded-xl border border-[#dad4ec] bg-[#0c0a16] text-violet-100 font-mono text-xs p-3.5 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRunModalOpen(false)}
                className="rounded-xl border border-[#dad4ec] px-4 py-2 text-xs font-semibold text-[#332c4d]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={running}
                onClick={() => void handleRunWorkflow()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                {running ? "Executing..." : "Run Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Workflow Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={handleCreateWorkflow}
            className="w-full max-w-md rounded-2xl bg-white border border-[#e5e1f2] shadow-2xl p-6 space-y-4"
          >
            <h3 className="text-lg font-bold text-[#141024]">Create New Workflow</h3>
            <div>
              <label className="block text-xs font-semibold text-[#332c4d] mb-1">
                Workflow Name
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Enterprise Security Review Router"
                className="w-full rounded-xl border border-[#dad4ec] px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#332c4d] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Describe trigger conditions and approval policy..."
                className="w-full rounded-xl border border-[#dad4ec] px-3.5 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="rounded-xl border border-[#dad4ec] px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Create &amp; Open
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
