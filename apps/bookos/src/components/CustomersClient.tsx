"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CalendarCheck2,
  Clock,
  Globe,
  Mail,
  Phone,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { useWorkspaceTimezone } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import { SUPPORTED_TIMEZONES, formatCurrency } from "@/lib/constants";
import { formatDateTimeInTimezone } from "@/lib/timezone";

type CustomerBooking = {
  id: string;
  bookingRef: string;
  serviceName: string;
  durationMins: number;
  staffName: string;
  startUtc: string;
  endUtc: string;
  customerTimezone: string;
  status: string;
  paymentStatus: string;
  paymentAmountCents: number;
  paymentReceiptRef: string | null;
  notes: string;
};

type CustomerRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  timezone: string;
  notes: string;
  createdAt: string;
  stats: {
    totalBookings: number;
    upcomingCount: number;
    completedCount: number;
    cancelledCount: number;
    lifetimeSandboxSpendCents: number;
  };
  bookings: CustomerBooking[];
};

export function CustomersClient() {
  const { timezone } = useWorkspaceTimezone();
  const { pushToast } = useToast();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [custTimezone, setCustTimezone] = useState("America/New_York");
  const [notes, setNotes] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/customers${qs}`);
      if (res.ok) {
        const j = (await res.json()) as { customers: CustomerRecord[] };
        setCustomers(j.customers);
        setSelectedId((prev) =>
          prev && j.customers.some((c) => c.id === prev) ? prev : j.customers[0]?.id || "",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCustomers(), 0);
    const onRefresh = () => void loadCustomers();
    window.addEventListener("bookos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bookos:refresh", onRefresh);
    };
  }, [loadCustomers]);

  async function handleCreateCustomer(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        timezone: custTimezone,
        notes,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      pushToast("error", data.error || "Could not create customer.");
      return;
    }
    pushToast("success", `Added ${fullName} to customer directory.`);
    setModalOpen(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setNotes("");
    void loadCustomers();
  }

  const selectedCustomer = customers.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#2563eb] uppercase">
            Client Directory
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1917] sm:text-3xl">
            Customers &amp; Booking History
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Inspect client profiles, preferred timezones, lifetime simulated spend, and complete
            appointment history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1d4ed8] sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Directory List */}
        <section className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs lg:col-span-5">
          <div className="border-b border-stone-100 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers by name, email, timezone..."
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] py-2 pl-9 pr-3 text-xs text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">No customers found.</div>
          ) : (
            <div className="divide-y divide-stone-100">
              {customers.map((cust) => {
                const selected = cust.id === selectedId;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => setSelectedId(cust.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors ${
                      selected ? "bg-blue-50/60" : "hover:bg-[#fafaf9]"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1c1917]">
                        {cust.fullName}
                      </p>
                      <p className="truncate text-xs text-stone-500">{cust.email}</p>
                      <p className="mt-1 text-[11px] text-stone-500">{cust.timezone}</p>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <span className="block text-xs font-semibold text-[#1c1917]">
                        {formatCurrency(cust.stats.lifetimeSandboxSpendCents)}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {cust.stats.totalBookings} bookings
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Detailed Customer Profile & History */}
        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs lg:col-span-7">
          {selectedCustomer ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-[#1c1917]">
                    {selectedCustomer.fullName}
                  </h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-stone-400" />
                      {selectedCustomer.email}
                    </span>
                    {selectedCustomer.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-stone-400" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
                      {selectedCustomer.timezone}
                    </span>
                  </div>
                  {selectedCustomer.notes && (
                    <p className="mt-2 text-xs text-stone-600">{selectedCustomer.notes}</p>
                  )}
                </div>

                <Link
                  href="/book"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#2563eb] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Book Slot</span>
                </Link>
              </div>

              {/* Customer Mini KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total Visits", value: String(selectedCustomer.stats.totalBookings) },
                  { label: "Upcoming", value: String(selectedCustomer.stats.upcomingCount) },
                  { label: "Completed", value: String(selectedCustomer.stats.completedCount) },
                  {
                    label: "Sandbox Spend",
                    value: formatCurrency(selectedCustomer.stats.lifetimeSandboxSpendCents),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-stone-200/80 bg-[#fafaf9] p-3"
                  >
                    <p className="text-[11px] font-medium text-stone-500">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-[#1c1917] tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Full Booking History */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-[#2563eb]" />
                  <h3 className="text-sm font-semibold text-[#1c1917]">
                    Past &amp; Upcoming Appointments
                  </h3>
                </div>

                {selectedCustomer.bookings.length === 0 ? (
                  <p className="rounded-xl border border-stone-200 bg-[#fafaf9] p-4 text-xs text-stone-500">
                    No appointments recorded for this customer yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCustomer.bookings.map((bk) => (
                      <div
                        key={bk.id}
                        className="flex flex-col gap-2 rounded-xl border border-stone-200/80 bg-[#fafaf9] p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-[#1c1917]">
                              {bk.serviceName}
                            </span>
                            <span className="font-mono text-[11px] text-stone-400">
                              {bk.bookingRef}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                                bk.status === "confirmed"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : bk.status === "rescheduled"
                                    ? "border-amber-200 bg-amber-50 text-amber-800"
                                    : bk.status === "completed"
                                      ? "border-blue-200 bg-blue-50 text-[#1d4ed8]"
                                      : "border-stone-200 bg-stone-100 text-stone-500"
                              }`}
                            >
                              {bk.status}
                            </span>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-600 tabular-nums">
                            <Clock className="h-3 w-3 text-[#2563eb]" />
                            {formatDateTimeInTimezone(bk.startUtc, timezone)} ({timezone}) · with{" "}
                            <span className="font-medium text-[#1c1917]">{bk.staffName}</span>
                          </p>
                        </div>

                        <div className="shrink-0 text-right tabular-nums">
                          <p className="text-xs font-semibold text-[#1c1917]">
                            {formatCurrency(bk.paymentAmountCents)}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {bk.paymentStatus === "sandbox_paid"
                              ? "Sandbox Paid"
                              : bk.paymentStatus === "refunded"
                                ? "Refunded"
                                : "Unpaid"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-stone-500">
              Select a customer to view their appointment history.
            </div>
          )}
        </section>
      </div>

      {/* Add Customer Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateCustomer}
            className="w-full max-w-md space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1c1917]">Add Customer</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">Full Name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">
                Preferred Timezone
              </label>
              <select
                value={custTimezone}
                onChange={(e) => setCustTimezone(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Create Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
