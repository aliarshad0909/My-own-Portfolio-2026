"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, ShieldCheck, Sparkles } from "lucide-react";
import { TriggerTypeBadge } from "@/components/StatusBadge";
import { NODE_TYPE_META, type FlowNode } from "@/lib/types";

type TemplateRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  nodesJson: FlowNode[];
  samplePayload: Record<string, unknown>;
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows?templates=true", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { workflows: TemplateRecord[] };
        setTemplates(json.workflows);
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

  async function handleClone(tpl: TemplateRecord) {
    setCloningId(tpl.id);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${tpl.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${tpl.name} — Custom` }),
      });
      const json = (await res.json()) as { workflow?: { id: string }; error?: string };
      if (!res.ok || !json.workflow) {
        setError(json.error || "Failed to clone template.");
      } else {
        router.push(`/editor/${json.workflow.id}`);
      }
    } finally {
      setCloningId(null);
    }
  }

  const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];
  const visible =
    category === "All" ? templates : templates.filter((t) => t.category === category);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7c3aed] mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Production Blueprints</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141024]">
            Workflow Templates
          </h1>
          <p className="text-sm text-[#5b5575] mt-1">
            Clone pre-wired deterministic AI pipelines complete with condition branches, data
            transforms, and mandatory human approval safety gates.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
              category === cat
                ? "bg-[#0c0a16] text-white border-[#0c0a16]"
                : "bg-white text-[#4a4268] border-[#e2dcf2] hover:border-[#7c3aed]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white border border-[#e5e1f2] p-12 text-center text-sm text-[#5b5575]">
          Loading workflow blueprints...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {visible.map((tpl) => {
            const hasGate = (tpl.nodesJson || []).some(
              (n) => n.data?.nodeType === "human_approval",
            );
            return (
              <article
                key={tpl.id}
                className="rounded-2xl bg-white border border-[#e5e1f2] hover:border-[#c3b0f7] p-6 flex flex-col justify-between gap-5 shadow-xs transition"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7c3aed]">
                      {tpl.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <TriggerTypeBadge triggerType={tpl.triggerType} />
                      {hasGate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <ShieldCheck className="h-3 w-3" />
                          Approval Gate
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-[#141024]">{tpl.name}</h2>
                    <p className="text-sm text-[#5b5575] mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  {/* Pipeline Node Preview */}
                  <div className="rounded-xl bg-[#f7f6fb] border border-[#e9e4f5] p-3.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#665f82] mb-2">
                      Node Pipeline ({tpl.nodesJson.length} steps)
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(tpl.nodesJson || []).map((node, idx) => {
                        const nt = node.data?.nodeType || "trigger";
                        const meta = NODE_TYPE_META[nt];
                        return (
                          <div key={node.id} className="inline-flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-white"
                              style={{ backgroundColor: meta?.accent || "#7c3aed" }}
                            >
                              {node.data?.label || meta?.shortLabel}
                            </span>
                            {idx < tpl.nodesJson.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-[#8c84a8]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#ece8f7] flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-mono text-[#665f82]">
                    Zero-key deterministic ready
                  </span>
                  <button
                    type="button"
                    disabled={cloningId === tpl.id}
                    onClick={() => void handleClone(tpl)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 transition shadow-md shadow-violet-600/20 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {cloningId === tpl.id ? "Cloning..." : "Clone & Open in Editor"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
