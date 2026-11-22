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

type RateRow = { code: string; rateToUsd: number };

const SAMPLE_CSV = `date,description,amount,currency,reference
2026-11-20,ACH CREDIT ALDER PINE DEPOSIT,4200.00,USD,DEP-204
2026-11-21,WIRE DEBIT AWS CLOUD COMPUTE,-680.50,USD,AWS-1121`;

export function ReconciliationClient() {
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [ratesByCode, setRatesByCode] = useState<Record<string, number>>({});
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({});
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reconciliation");
      if (!res.ok) return;
      const json = (await res.json()) as { statements: StatementRow[]; currencyRates?: RateRow[] };
      setStatements(json.statements);
      const map: Record<string, number> = {};
      for (const r of json.currencyRates ?? []) {
        map[r.code.toUpperCase()] = r.rateToUsd;
      }
      setRatesByCode(map);
      setRateInputs((prev) => {
        const next = { ...prev };
        for (const st of json.statements) {
          const code = (st.currency || "USD").toUpperCase();
          if (code !== "USD" && next[st.id] === undefined && map[code]) {
            next[st.id] = String(map[code]);
          }
        }
        return next;
      });
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
      setMessage({ text: json.error || "CSV import failed", isError: true });
      return;
    }
    setMessage({ text: `Imported ${json.importedCount} bank statement row(s) into PostgreSQL.` });
    await load();
  }

  async function handleReconcile(st: StatementRow, transactionId?: string) {
    setBusyId(st.id);
    setMessage(null);
    try {
      const code = (st.currency || "USD").toUpperCase();
      const payload: { statementId: string; transactionId?: string; exchangeRate?: number } = {
        statementId: st.id,
        transactionId,
      };
      if (!transactionId && code !== "USD") {
        const rawRate = rateInputs[st.id] ?? (ratesByCode[code] ? String(ratesByCode[code]) : "");
        const parsedRate = Number(rawRate);
        if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
          setMessage({
            text: `Enter a positive ${code} → USD conversion rate before posting this foreign-currency line.`,
            isError: true,
          });
          return;
        }
        payload.exchangeRate = parsedRate;
      }

      const res = await fetch("/api/reconciliation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ text: json.error || "Reconciliation failed", isError: true });
        return;
      }
      setMessage({
        text: transactionId
          ? "Bank line matched with existing ledger transaction and marked reconciled."
          : "Created matching ledger entry and marked bank line reconciled.",
      });
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
          {message ? (
            <span className={`text-xs font-semibold ${message.isError ? "text-red-600" : "text-teal-800"}`}>
              {message.text}
            </span>
          ) : (
            <span />
          )}
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
          {statements.map((st) => {
            const currencyCode = (st.currency || "USD").toUpperCase();
            const needsFxRate = st.status !== "reconciled" && !st.suggestedTransactionId && currencyCode !== "USD";
            return (
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
                        onClick={() => void handleReconcile(st, st.suggestedTransactionId!)}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Match &amp; Reconcile</span>
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {needsFxRate ? (
                          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="font-semibold">1 {currencyCode} =</span>
                            <input
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              placeholder="USD rate"
                              value={rateInputs[st.id] ?? ""}
                              onChange={(e) =>
                                setRateInputs((prev) => ({
                                  ...prev,
                                  [st.id]: e.target.value,
                                }))
                              }
                              className="w-24 px-2 py-1 rounded-md border border-slate-300 text-xs tabular-nums"
                              aria-label={`${currencyCode} to USD exchange rate`}
                            />
                            <span className="font-semibold">USD</span>
                          </label>
                        ) : null}
                        <button
                          type="button"
                          disabled={busyId === st.id}
                          onClick={() => void handleReconcile(st)}
                          className="px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          Post &amp; Reconcile
                        </button>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
