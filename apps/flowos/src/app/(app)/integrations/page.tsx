"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Cpu,
  Globe,
  Plug,
  Send,
  ShieldCheck,
  Webhook,
} from "lucide-react";

type IntegrationRecord = {
  id: string;
  name: string;
  kind: "webhook" | "n8n" | "http" | "ai_deterministic";
  endpointUrl: string;
  enabled: boolean;
  description: string;
  configJson: Record<string, unknown>;
  lastTestedAt: string | null;
  lastStatus: string;
};

type WorkflowAnalytics = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  totalRuns: number;
  completedRuns: number;
  pendingApprovals: number;
  failedRuns: number;
  avgDurationMs: number;
};

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationRecord[]>([]);
  const [aiRuntime, setAiRuntime] = useState<{
    defaultMode: string;
    liveLlmConfigured: boolean;
    model: string;
  } | null>(null);
  const [analytics, setAnalytics] = useState<WorkflowAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Webhook URL Tester state
  const [testUrl, setTestUrl] = useState("https://n8n.example.com/webhook/flowos-bridge");
  const [testMethod, setTestMethod] = useState<"POST" | "GET" | "PUT" | "PATCH">("POST");
  const [testPayload, setTestPayload] = useState(
    JSON.stringify(
      {
        event: "flowos.approved_dispatch",
        workflow: "Inbound Lead Qualification & Approval",
        approvedBy: "Aria Vance (Demo Ops)",
        score: 88,
      },
      null,
      2,
    ),
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [intRes, dashRes] = await Promise.all([
        fetch("/api/integrations", { cache: "no-store" }),
        fetch("/api/dashboard", { cache: "no-store" }),
      ]);
      if (intRes.ok) {
        const j = (await intRes.json()) as {
          integrations: IntegrationRecord[];
          aiRuntime: { defaultMode: string; liveLlmConfigured: boolean; model: string };
        };
        setItems(j.integrations);
        setAiRuntime(j.aiRuntime);
      }
      if (dashRes.ok) {
        const d = (await dashRes.json()) as { perWorkflow: WorkflowAnalytics[] };
        setAnalytics(d.perWorkflow || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleUpdateIntegration(
    item: IntegrationRecord,
    patch: { enabled?: boolean; endpointUrl?: string },
  ) {
    setSavingId(item.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/integrations/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { integration?: IntegrationRecord; error?: string };
      if (!res.ok || !json.integration) {
        setNotice(json.error || "Unable to save integration.");
      } else {
        setItems((prev) => prev.map((x) => (x.id === item.id ? json.integration! : x)));
        setNotice(`Saved "${json.integration.name}".`);
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handleTestWebhook(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    setTestError(null);
    setTestResult(null);

    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(testPayload || "{}") as Record<string, unknown>;
    } catch {
      setTestError("Test payload must be valid JSON.");
      setTesting(false);
      return;
    }

    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: testUrl,
          method: testMethod,
          payload: parsedPayload,
        }),
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        setTestError(String(json.error || "Webhook verification failed."));
      } else {
        setTestResult(json);
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141024]">
          Integrations &amp; Analytics
        </h1>
        <p className="text-sm text-[#5b5575] mt-1">
          Configure webhook endpoints, optional n8n bridges, deterministic AI runtime settings, and
          review per-workflow telemetry.
        </p>
      </div>

      {notice && (
        <div className="rounded-xl bg-[#0c0a16] text-violet-100 border border-violet-500/30 px-4 py-3 text-xs flex items-center justify-between gap-2">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-violet-300 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Deterministic AI Runtime Banner */}
      <section className="rounded-2xl bg-[#0c0a16] text-white border border-[#2a2245] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-[#7c3aed] flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold">Deterministic AI Mode Active</h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Zero Paid API Key Required
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              FlowOS executes lead scoring, SLA ticket triage, inventory replenishment analysis, and
              invoice escalation drafting deterministically on-server. Optional server-side LLM
              routing activates only if <code className="font-mono text-violet-300">OPENAI_API_KEY</code>{" "}
              is configured.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-[#18132d] border border-[#312854] px-4 py-3 text-xs font-mono shrink-0 space-y-1">
          <div className="text-slate-400">
            Runtime: <span className="text-violet-300">{aiRuntime?.defaultMode || "deterministic"}</span>
          </div>
          <div className="text-slate-400">
            Live LLM Key:{" "}
            <span className={aiRuntime?.liveLlmConfigured ? "text-emerald-300" : "text-amber-300"}>
              {aiRuntime?.liveLlmConfigured ? "Configured" : "Not set (offline-safe)"}
            </span>
          </div>
        </div>
      </section>

      {/* Connected Integrations + Webhook URL Tester */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Integration Cards */}
        <section className="xl:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#141024]">
            <Plug className="h-4 w-4 text-[#7c3aed]" />
            <span>Configured Connectors &amp; n8n Bridge</span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white border border-[#e5e1f2] p-8 text-center text-sm text-[#5b5575]">
              Loading integrations...
            </div>
          ) : (
            <div className="space-y-3.5">
              {items.map((item) => {
                const Icon =
                  item.kind === "ai_deterministic"
                    ? Bot
                    : item.kind === "webhook"
                      ? Webhook
                      : Globe;
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-[#e5e1f2] p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-[#f3efff] text-[#7c3aed] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-[#141024]">{item.name}</h3>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#f3efff] text-[#5b21b6] font-semibold">
                              {item.kind}
                            </span>
                          </div>
                          <p className="text-xs text-[#5b5575] mt-1">{item.description}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() =>
                          void handleUpdateIntegration(item, { enabled: !item.enabled })
                        }
                        className={`rounded-full px-3 py-1 text-xs font-semibold border transition cursor-pointer shrink-0 ${
                          item.enabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-300"
                        }`}
                      >
                        {item.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>

                    {item.kind !== "ai_deterministic" && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="url"
                          value={item.endpointUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, endpointUrl: val } : x)),
                            );
                          }}
                          className="flex-1 min-w-0 rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3 py-2 font-mono text-xs"
                          placeholder="https://..."
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={savingId === item.id}
                            onClick={() =>
                              void handleUpdateIntegration(item, { endpointUrl: item.endpointUrl })
                            }
                            className="rounded-xl bg-[#0c0a16] hover:bg-[#7c3aed] text-white text-xs font-semibold px-3.5 py-2 transition cursor-pointer"
                          >
                            Save URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setTestUrl(item.endpointUrl)}
                            className="rounded-xl border border-[#dad4ec] bg-white hover:bg-[#f3efff] text-[#332c4d] text-xs font-semibold px-3 py-2 cursor-pointer"
                          >
                            Load in Tester
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Webhook URL Tester */}
        <section className="xl:col-span-5 rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#141024]">Webhook URL Tester</h2>
              <p className="text-xs text-[#665f82]">
                Verifies URL safety (SSRF guard) &amp; simulates sandbox JSON webhook delivery.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[#7c3aed] shrink-0" />
          </div>

          <form onSubmit={handleTestWebhook} className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <select
                value={testMethod}
                onChange={(e) =>
                  setTestMethod(e.target.value as "POST" | "GET" | "PUT" | "PATCH")
                }
                className="rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-2.5 py-2 text-xs font-semibold"
              >
                {["POST", "PUT", "PATCH", "GET"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="url"
                required
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="col-span-3 rounded-xl border border-[#dad4ec] bg-[#faf9fd] px-3 py-2 font-mono text-xs"
                placeholder="https://n8n.example.com/webhook/..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#332c4d] mb-1">
                Test JSON Body
              </label>
              <textarea
                rows={6}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full rounded-xl bg-[#0c0a16] text-violet-100 font-mono text-xs p-3 border border-[#2a2245]"
              />
            </div>

            <button
              type="submit"
              disabled={testing}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-4 transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {testing ? "Verifying Endpoint..." : "Run Safe Webhook Verification"}
            </button>
          </form>

          {testError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              {testError}
            </div>
          )}

          {testResult && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  HTTP {String(testResult.httpStatus)} OK • {String(testResult.latencyMs)}ms • SSRF:{" "}
                  {String(testResult.ssrfCheck)}
                </span>
              </div>
              <pre className="rounded-lg bg-[#0c0a16] text-violet-100 p-2.5 text-[11px] font-mono overflow-x-auto max-h-48">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>

      {/* Per-Workflow Execution Analytics */}
      <section className="rounded-2xl bg-white border border-[#e5e1f2] p-5 sm:p-6 min-w-0">
        <div className="mb-4">
          <h2 className="text-base font-bold text-[#141024]">Per-Workflow Execution Analytics</h2>
          <p className="text-xs text-[#665f82]">
            Throughput, completion reliability, pending human approvals, and average runtime across
            pipelines.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-[#ece8f7] text-[11px] font-semibold uppercase tracking-wider text-[#746c91]">
                <th className="py-2.5 pr-3">Workflow</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Runs</th>
                <th className="py-2.5 px-3">Completed</th>
                <th className="py-2.5 px-3">Awaiting Gate</th>
                <th className="py-2.5 px-3">Failed</th>
                <th className="py-2.5 pl-3 text-right">Avg Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eef9] text-sm">
              {analytics.map((wf) => (
                <tr key={wf.id} className="hover:bg-[#faf8ff]">
                  <td className="py-3 pr-3 font-semibold text-[#141024]">{wf.name}</td>
                  <td className="py-3 px-3 text-xs text-[#5b5575]">{wf.category}</td>
                  <td className="py-3 px-3 font-mono text-xs">{wf.totalRuns}</td>
                  <td className="py-3 px-3 font-mono text-xs text-emerald-700 font-semibold">
                    {wf.completedRuns}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-amber-700 font-semibold">
                    {wf.pendingApprovals}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-rose-700 font-semibold">
                    {wf.failedRuns}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono text-xs text-[#5b5575]">
                    {wf.avgDurationMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
