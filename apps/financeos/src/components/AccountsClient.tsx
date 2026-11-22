"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";

type AccountRow = {
  id: string;
  type: "customer" | "vendor";
  name: string;
  contactName: string;
  email: string;
  currency: string;
  paymentTermsDays: number;
  invoiceCount: number;
  openBalanceCents: number;
  paidTotalCents: number;
};

export function AccountsClient() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"customer" | "vendor">("customer");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("USD");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) return;
      const json = (await res.json()) as { accounts: AccountRow[] };
      setAccounts(json.accounts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, name, contactName, email, currency }),
    });
    if (res.ok) {
      setName("");
      setContactName("");
      setEmail("");
      await load();
    }
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer (AR) &amp; Vendor (AP) Accounts</h1>
        <p className="text-sm text-slate-500">Live open receivables and payables aggregated per counterparty.</p>
      </div>

      <form onSubmit={(e) => void handleAdd(e)} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-600" />
          <span>Add Counterparty Account</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "customer" | "vendor")}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="customer">Customer (AR)</option>
            <option value="vendor">Vendor (AP)</option>
          </select>
          <input
            required
            placeholder="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            placeholder="Primary Contact"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <input
            type="email"
            placeholder="billing@company.example"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-20 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <button
              type="submit"
              className="flex-1 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="text-sm text-slate-500">Loading accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">{a.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                    a.type === "customer" ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {a.type === "customer" ? "Customer · AR" : "Vendor · AP"}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {a.contactName || "Finance Desk"} · {a.email || "No email"} · Net {a.paymentTermsDays} ({a.currency})
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-600">
                  Open {a.type === "customer" ? "AR" : "AP"}:{" "}
                  <strong className="text-slate-900 tabular-nums">{formatMoney(a.openBalanceCents)}</strong>
                </span>
                <span className="text-slate-500 tabular-nums">
                  Settled: {formatMoney(a.paidTotalCents)} ({a.invoiceCount} docs)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
