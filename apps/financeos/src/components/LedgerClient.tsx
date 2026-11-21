"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { formatMoney } from "@/lib/format";

type TxItem = {
  id: string;
  type: string;
  category: string;
  description: string;
  accountName: string | null;
  reference: string;
  currency: string;
  exchangeRate: number;
  amountCents: number;
  baseAmountCents: number;
  status: string;
  reconciled: number;
  occurredAt: string;
};

type AccountOpt = { id: string; name: string; type: string; currency: string };

const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  AED: 0.2723,
  PKR: 0.0036,
};

export function LedgerClient() {
  const [rows, setRows] = useState<TxItem[]>([]);
  const [accounts, setAccounts] = useState<AccountOpt[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [type, setType] = useState<"income" | "expense" | "purchase" | "sale">("expense");
  const [category, setCategory] = useState("Cloud & Infrastructure");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");

  const load = useCallback(async () => {
    try {
      const sp = new URLSearchParams();
      if (filterType !== "all") sp.set("type", filterType);
      if (query.trim()) sp.set("q", query.trim());
      const res = await fetch(`/api/transactions?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to load ledger");
      const json = (await res.json()) as { transactions: TxItem[]; accounts: AccountOpt[] };
      setRows(json.transactions);
      setAccounts(json.accounts);
    } finally {
      setLoading(false);
    }
  }, [filterType, query]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setFeedback("Enter a valid amount greater than zero.");
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category,
          description,
          accountId: accountId || null,
          reference,
          currency,
          exchangeRate: Number(exchangeRate) || 1,
          amountCents: Math.round(numeric * 100),
          occurredAt,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to save transaction");
      setDescription("");
      setAmount("");
      setReference("");
      setFeedback("Transaction recorded to PostgreSQL ledger.");
      await load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transactions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Income, Expenses, Sales &amp; Purchase Ledger</h1>
        <p className="text-sm text-slate-500">
          Multi-currency ledger with explicit exchange-rate conversion to base USD reporting cents.
        </p>
      </div>

      {/* Record Transaction Form */}
      <form
        onSubmit={(e) => void handleCreate(e)}
        className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
      >
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" />
          <span>Record New Transaction</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="sale">Sale (Revenue)</option>
              <option value="income">Income (Other)</option>
              <option value="expense">Operating Expense</option>
              <option value="purchase">Purchase (COGS)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
            <input
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <input
              required
              placeholder="e.g. Monthly cloud compute"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Account (Optional)</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="">None</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Amount</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="1250.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Currency &amp; FX Rate to USD</label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => {
                  const next = e.target.value;
                  setCurrency(next);
                  setExchangeRate(String(DEFAULT_RATES[next] ?? 1));
                }}
                className="w-24 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                {Object.keys(DEFAULT_RATES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
            <input
              type="date"
              required
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reference</label>
            <input
              placeholder="INV / PO / REF"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {feedback ? <span className="text-xs font-semibold text-teal-800">{feedback}</span> : <span />}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving..." : "Post Ledger Transaction"}
          </button>
        </div>
      </form>

      {/* Filter Bar & Table */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {["all", "sale", "income", "purchase", "expense"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase cursor-pointer ${
                  filterType === t
                    ? "bg-[#111827] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description, ref..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-6">Loading ledger transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Category &amp; Description</th>
                  <th className="py-2 pr-3">Original</th>
                  <th className="py-2 pr-3 text-right">Base USD</th>
                  <th className="py-2 pr-3">Bank</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((tx) => {
                  const inflow = tx.type === "income" || tx.type === "sale";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {tx.occurredAt}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            inflow ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-slate-900">{tx.description}</div>
                        <div className="text-xs text-slate-500">
                          {tx.category}
                          {tx.accountName ? ` · ${tx.accountName}` : ""}
                          {tx.reference ? ` · Ref: ${tx.reference}` : ""}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatMoney(tx.amountCents, tx.currency)}
                      </td>
                      <td
                        className={`py-2.5 pr-3 text-right font-bold tabular-nums whitespace-nowrap ${
                          inflow ? "text-teal-700" : "text-slate-900"
                        }`}
                      >
                        {inflow ? "+" : "-"}
                        {formatMoney(tx.baseAmountCents)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            tx.reconciled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {tx.reconciled ? "Reconciled" : "Unreconciled"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => void handleDelete(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
