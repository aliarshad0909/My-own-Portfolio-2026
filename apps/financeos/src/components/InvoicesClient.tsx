"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, CheckCircle2, Send } from "lucide-react";
import { formatMoney } from "@/lib/format";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  direction: string;
  accountName: string;
  status: string;
  currency: string;
  subtotalCents: number;
  taxRatePct: number;
  taxCents: number;
  totalCents: number;
  baseTotalCents: number;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  items: { id: string; description: string; quantity: number; unitPriceCents: number }[];
};

type AccountOpt = { id: string; name: string; type: string; currency: string };

export function InvoicesClient() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [accounts, setAccounts] = useState<AccountOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [direction, setDirection] = useState<"receivable" | "payable">("receivable");
  const [accountId, setAccountId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [taxRatePct, setTaxRatePct] = useState("5");
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10),
  );
  const [itemDesc, setItemDesc] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to load invoices");
      const json = (await res.json()) as { invoices: InvoiceRow[]; accounts: AccountOpt[] };
      setInvoices(json.invoices);
      setAccounts(json.accounts);
      setAccountId((prev) => prev || json.accounts[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const unitPriceCents = Math.round((Number(itemPrice) || 0) * 100);
    if (!accountId || unitPriceCents <= 0) {
      setNotice("Select an account and enter a positive unit price.");
      return;
    }
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        accountId,
        currency,
        exchangeRate: currency === "EUR" ? 1.08 : currency === "GBP" ? 1.27 : 1,
        taxRatePct: Number(taxRatePct) || 0,
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate,
        items: [{ description: itemDesc, quantity: Math.max(1, Number(itemQty) || 1), unitPriceCents }],
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setNotice(json.error || "Could not create invoice");
      return;
    }
    setItemDesc("");
    setItemPrice("");
    setNotice("Invoice/Bill created and audited.");
    await load();
  }

  async function runAction(id: string, action: "send" | "mark_paid" | "mark_overdue") {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await fetch(`/api/invoices/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Invoice update failed");
      setNotice(
        action === "mark_paid"
          ? "Marked paid and automatically posted settlement to PostgreSQL ledger."
          : `Invoice updated (${action}).`,
      );
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices (AR) &amp; Vendor Bills (AP)</h1>
        <p className="text-sm text-slate-500">
          Create multi-currency invoices or vendor bills. Marking paid atomically posts the settlement entry to the ledger.
        </p>
      </div>

      <form onSubmit={(e) => void handleCreate(e)} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" />
          <span>Create Invoice or Vendor Bill</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as "receivable" | "payable")}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="receivable">Customer Invoice (AR)</option>
              <option value="payable">Vendor Bill (AP)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Currency &amp; Tax %</label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-24 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={taxRatePct}
                onChange={(e) => setTaxRatePct(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Line Item Description</label>
            <input
              required
              placeholder="e.g. Custom ERP Module Milestone"
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={itemQty}
              onChange={(e) => setItemQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Price</label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder="2500.00"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {notice ? <span className="text-xs font-semibold text-teal-800">{notice}</span> : <span />}
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
          >
            Create Document
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Loading invoices...</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 tabular-nums">{inv.invoiceNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 uppercase">
                    {inv.direction === "receivable" ? "AR Receivable" : "AP Payable"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      inv.status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : inv.status === "overdue"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-700">{inv.accountName}</div>
                <div className="text-xs text-slate-500">
                  Issued {inv.issueDate} · Due {inv.dueDate}
                  {inv.paidAt ? ` · Paid ${inv.paidAt}` : ""}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <div className="text-base font-bold text-slate-900 tabular-nums">
                    {formatMoney(inv.totalCents, inv.currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Base: {formatMoney(inv.baseTotalCents)}
                  </div>
                </div>
                {inv.status === "draft" ? (
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void runAction(inv.id, "send")}
                    className="px-3 py-1.5 rounded-lg bg-[#111827] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mark Sent</span>
                  </button>
                ) : null}
                {inv.status !== "paid" ? (
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => void runAction(inv.id, "mark_paid")}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Paid</span>
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
