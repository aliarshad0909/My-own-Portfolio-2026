"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/format";

type StatementRow = {
  id: string;
  statementDate: string;
  description: string;
  reference: string;
  currency: string;
  amountCents: number;
  status: string;
  suggestedTransactionId: string | null;
  suggestedDescription: string | null;
};

const SAMPLE_CSV = `date,description,amount,currency,reference
2026-11-20,ACH CREDIT ALDER PINE DEPOSIT,4200.00,USD,DEP-204
2026-11-21,WIRE DEBIT AWS CLOUD COMPUTE,-680.50,USD,AWS-1121`;

export function ReconciliationClient() {
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reconciliation");
      if (!res.ok) return;
      const json = (await res.json()) as { statements: StatementRow[] };
      setStatements(json.statements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/reconciliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvText }),
    });
    const json = (await res.json().catch(() => ({}))) as { importedCount?: number; error?: string };
    if (!res.ok) {
      setMessage(json.error || "CSV import failed");
      return;
    }
    setMessage(`Imported ${json.importedCount} bank statement row(s) into PostgreSQL.`);
    await load();
  }

  async function handleReconcile(statementId: string, transactionId?: string) {
    setBusyId(statementId);
    setMessage(null);
    try {
      const res = await fetch("/api/reconciliation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId, transactionId }),
      });
      if (!res.ok) throw new Error("Reconciliation failed");
      setMessage(
        transactionId
          ? "Bank line matched with existing ledger transaction and marked reconciled."
          : "Created matching ledger entry and marked bank line reconciled.",
      );
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CSV Bank Statement Import &amp; Reconciliation</h1>
        <p className="text-sm text-slate-500">
          Upload or paste CSV statement lines (`date,description,amount,currency,reference`) and reconcile them against ledger transactions.
        </p>
      </div>

      <form onSubmit={(e) => void handleImport(e)} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Import CSV Statement Lines</span>
          </div>
          <label className="text-xs font-semibold text-teal-700 cursor-pointer hover:underline">
            <span>Load .csv file</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                if (!file) return;
                void file.text().then((txt) => setCsvText(txt));
              }}
            />
          </label>
        </div>
        <textarea
          rows={4}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 bg-slate-50"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          {message ? <span className="text-xs font-semibold text-teal-800">{message}</span> : <span />}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
          >
            Import CSV Rows
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Loading bank feed...</div>
      ) : (
        <div className="space-y-3">
          {statements.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 tabular-nums">{st.statementDate}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      st.status === "reconciled"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {st.status}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{st.description}</div>
                {st.suggestedDescription ? (
                  <div className="text-xs text-teal-700">
                    Suggested ledger match: <strong>{st.suggestedDescription}</strong>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`font-bold tabular-nums ${
                    st.amountCents > 0 ? "text-teal-700" : "text-slate-900"
                  }`}
                >
                  {st.amountCents > 0 ? "+" : ""}
                  {formatMoney(st.amountCents, st.currency)}
                </span>
                {st.status !== "reconciled" ? (
                  st.suggestedTransactionId ? (
                    <button
                      type="button"
                      disabled={busyId === st.id}
                      onClick={() => void handleReconcile(st.id, st.suggestedTransactionId!)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Match &amp; Reconcile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === st.id}
                      onClick={() => void handleReconcile(st.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      Post &amp; Reconcile
                    </button>
                  )
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
