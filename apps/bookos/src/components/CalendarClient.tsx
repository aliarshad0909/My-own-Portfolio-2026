"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  Mail,
  MessageSquare,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useWorkspaceTimezone } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import {
  buildAvailabilityKey,
  canConfirmBooking,
  shouldApplyAvailabilityResponse,
} from "@/lib/booking-form-state";
import {
  SUPPORTED_TIMEZONES,
  formatCurrency,
  type SupportedTimezone,
} from "@/lib/constants";
import {
  formatDateInTimezone,
  formatDateTimeInTimezone,
  formatTimeInTimezone,
  getDateKeyInTimezone,
} from "@/lib/timezone";

type BookingItem = {
  id: string;
  bookingRef: string;
  serviceId: string;
  serviceName: string;
  durationMins: number;
  staffId: string;
  staffName: string;
  staffAvatarColor: string;
  customerName: string;
  customerEmail: string;
  startUtc: string;
  endUtc: string;
  customerTimezone: string;
  status: string;
  paymentStatus: string;
  paymentAmountCents: number;
  paymentReceiptRef: string | null;
  notes: string;
};

type StaffOption = { id: string; name: string };

type ReminderItem = {
  id: string;
  bookingRef: string;
  bookingStartUtc: string | null;
  channel: string;
  scheduledForUtc: string;
  status: string;
  message: string;
  serviceName: string;
  staffName: string;
  customerName: string;
};

type SlotOption = {
  startUtc: string;
  endUtc: string;
  label: string;
  available: boolean;
};

export function CalendarClient() {
  const { timezone, setTimezone } = useWorkspaceTimezone();
  const { pushToast } = useToast();

  const [tab, setTab] = useState<"schedule" | "reminders">("schedule");
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffFilter, setStaffFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<SlotOption[]>([]);
  const [rescheduleSelectedUtc, setRescheduleSelectedUtc] = useState("");
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = useState(false);
  const [rescheduleLoadedKey, setRescheduleLoadedKey] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const rescheduleSeqRef = useRef(0);
  const rescheduleAbortRef = useRef<AbortController | null>(null);
  const rescheduleActiveKeyRef = useRef("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (staffFilter !== "all") params.set("staffId", staffFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const [bkRes, remRes, stfRes] = await Promise.all([
        fetch(`/api/bookings?${params.toString()}`),
        fetch("/api/reminders"),
        fetch("/api/staff"),
      ]);

      if (bkRes.ok) {
        const j = (await bkRes.json()) as { bookings: BookingItem[] };
        setBookings(j.bookings);
      }
      if (remRes.ok) {
        const j = (await remRes.json()) as { reminders: ReminderItem[] };
        setReminders(j.reminders);
      }
      if (stfRes.ok) {
        const j = (await stfRes.json()) as { staff: StaffOption[] };
        setStaffOptions(j.staff);
      }
    } finally {
      setLoading(false);
    }
  }, [staffFilter, statusFilter, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    const onRefresh = () => void loadAll();
    window.addEventListener("bookos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bookos:refresh", onRefresh);
    };
  }, [loadAll]);

  // Group bookings by calendar date in viewer timezone
  const groupedByDate = useMemo(() => {
    const map = new Map<string, BookingItem[]>();
    const sorted = [...bookings].sort((a, b) => a.startUtc.localeCompare(b.startUtc));
    for (const item of sorted) {
      const key = getDateKeyInTimezone(item.startUtc, timezone);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [bookings, timezone]);

  const loadRescheduleSlots = useCallback(
    async (target: BookingItem, dateStr: string) => {
      const requestKey = buildAvailabilityKey({
        serviceId: target.serviceId,
        staffId: target.staffId,
        date: dateStr,
        timezone,
      });

      rescheduleAbortRef.current?.abort();
      if (!requestKey) {
        rescheduleAbortRef.current = null;
        rescheduleSeqRef.current += 1;
        rescheduleActiveKeyRef.current = "";
        setRescheduleSlots([]);
        setRescheduleSelectedUtc("");
        setRescheduleLoadedKey(null);
        setRescheduleLoadingSlots(false);
        return;
      }

      const controller = new AbortController();
      rescheduleAbortRef.current = controller;
      const requestSeq = rescheduleSeqRef.current + 1;
      rescheduleSeqRef.current = requestSeq;
      rescheduleActiveKeyRef.current = requestKey;

      setRescheduleLoadingSlots(true);
      setRescheduleSelectedUtc("");
      setRescheduleSlots([]);
      setRescheduleLoadedKey(null);
      setRescheduleError(null);

      try {
        const params = new URLSearchParams({
          serviceId: target.serviceId,
          staffId: target.staffId,
          date: dateStr,
          timezone,
          excludeBookingId: target.id,
        });
        const res = await fetch(`/api/slots?${params.toString()}`, {
          signal: controller.signal,
        });

        if (
          !shouldApplyAvailabilityResponse({
            requestSeq,
            latestRequestSeq: rescheduleSeqRef.current,
            requestKey,
            currentKey: rescheduleActiveKeyRef.current,
            aborted: controller.signal.aborted,
          })
        ) {
          return;
        }

        if (res.ok) {
          const j = (await res.json()) as { slots: SlotOption[] };
          if (
            !shouldApplyAvailabilityResponse({
              requestSeq,
              latestRequestSeq: rescheduleSeqRef.current,
              requestKey,
              currentKey: rescheduleActiveKeyRef.current,
              aborted: controller.signal.aborted,
            })
          ) {
            return;
          }
          setRescheduleSlots(j.slots);
          setRescheduleLoadedKey(requestKey);
          setRescheduleSelectedUtc(j.slots.find((s) => s.available)?.startUtc || "");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      } finally {
        if (
          shouldApplyAvailabilityResponse({
            requestSeq,
            latestRequestSeq: rescheduleSeqRef.current,
            requestKey,
            currentKey: rescheduleActiveKeyRef.current,
            aborted: controller.signal.aborted,
          })
        ) {
          setRescheduleLoadingSlots(false);
        }
      }
    },
    [timezone],
  );

  function closeRescheduleModal() {
    rescheduleAbortRef.current?.abort();
    rescheduleAbortRef.current = null;
    rescheduleSeqRef.current += 1;
    rescheduleActiveKeyRef.current = "";
    setRescheduleTarget(null);
    setRescheduleSlots([]);
    setRescheduleSelectedUtc("");
    setRescheduleLoadedKey(null);
    setRescheduleError(null);
  }

  function openReschedule(item: BookingItem) {
    const currentDate = getDateKeyInTimezone(item.startUtc, timezone);
    setRescheduleTarget(item);
    setRescheduleDate(currentDate);
    setRescheduleSelectedUtc("");
    setRescheduleSlots([]);
    setRescheduleLoadedKey(null);
    setRescheduleError(null);
    void loadRescheduleSlots(item, currentDate);
  }

  const rescheduleCriteriaKey = rescheduleTarget
    ? buildAvailabilityKey({
        serviceId: rescheduleTarget.serviceId,
        staffId: rescheduleTarget.staffId,
        date: rescheduleDate,
        timezone,
      })
    : "";

  const isRescheduleConfirmReady =
    Boolean(rescheduleTarget) &&
    canConfirmBooking({
      submitting: Boolean(rescheduleTarget && mutatingId === rescheduleTarget.id),
      slotsLoading: rescheduleLoadingSlots,
      currentCriteriaKey: rescheduleCriteriaKey,
      loadedCriteriaKey: rescheduleLoadedKey,
      selectedSlotUtc: rescheduleSelectedUtc,
      slots: rescheduleSlots,
    });

  async function submitReschedule() {
    if (!rescheduleTarget || !isRescheduleConfirmReady) return;
    setMutatingId(rescheduleTarget.id);
    setRescheduleError(null);
    try {
      const res = await fetch(`/api/bookings/${rescheduleTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          startUtc: rescheduleSelectedUtc,
          customerTimezone: timezone,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setRescheduleError(data.error || "Unable to reschedule.");
        pushToast("error", data.error || "Reschedule failed.");
        return;
      }
      pushToast("success", `Booking ${rescheduleTarget.bookingRef} rescheduled & reminders updated.`);
      closeRescheduleModal();
      void loadAll();
    } finally {
      setMutatingId(null);
    }
  }

  async function handleCancel(item: BookingItem) {
    setMutatingId(item.id);
    try {
      const res = await fetch(`/api/bookings/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: "Cancelled from Admin Calendar",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast("error", data.error || "Unable to cancel booking.");
        return;
      }
      pushToast(
        "success",
        `Cancelled ${item.bookingRef} — time slot immediately freed${
          item.paymentStatus === "sandbox_paid" ? " & sandbox payment refunded" : ""
        }.`,
      );
      void loadAll();
    } finally {
      setMutatingId(null);
    }
  }

  async function handleComplete(item: BookingItem) {
    setMutatingId(item.id);
    try {
      const res = await fetch(`/api/bookings/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast("error", data.error || "Unable to complete booking.");
        void loadAll();
        return;
      }
      pushToast("success", `Marked ${item.bookingRef} as completed.`);
      void loadAll();
    } finally {
      setMutatingId(null);
    }
  }

  async function handleMarkReminderSent(id: string) {
    const res = await fetch(`/api/reminders/${id}`, { method: "PATCH" });
    if (res.ok) {
      pushToast("success", "Simulated reminder dispatched.");
      void loadAll();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#2563eb] uppercase">
            Schedule &amp; Automation
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1917] sm:text-3xl">
            Calendar &amp; Reminders
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Reschedule with live overlap checks, cancel to free slots instantly, and inspect the
            automated reminder queue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setTab("schedule")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "schedule"
                  ? "bg-[#2563eb] text-white"
                  : "text-stone-600 hover:text-[#1c1917]"
              }`}
            >
              Schedule ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("reminders")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === "reminders"
                  ? "bg-[#2563eb] text-white"
                  : "text-stone-600 hover:text-[#1c1917]"
              }`}
            >
              Reminders Queue ({reminders.length})
            </button>
          </div>
        </div>
      </div>

      {tab === "schedule" ? (
        <>
          {/* Filter Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ref, customer, service..."
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] py-2 pl-9 pr-3 text-xs text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-xs">
                <Filter className="h-3.5 w-3.5 text-stone-500" />
                <select
                  aria-label="Filter by specialist"
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="bg-transparent font-medium text-[#1c1917] focus:outline-none"
                >
                  <option value="all">All Specialists</option>
                  {staffOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-xs font-medium text-[#1c1917] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="rescheduled">Rescheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
              <select
                aria-label="Calendar timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value as SupportedTimezone)}
                className="bg-transparent font-medium text-[#1c1917] focus:outline-none"
              >
                {SUPPORTED_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grouped Interactive Schedule */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200/60" />
              ))}
            </div>
          ) : groupedByDate.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-600">
              No appointments match the selected filters.
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByDate.map(([dateKey, items]) => (
                <div key={dateKey} className="space-y-2.5">
                  <h2 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                    {formatDateInTimezone(items[0].startUtc, timezone)} · {items.length}{" "}
                    {items.length === 1 ? "appointment" : "appointments"}
                  </h2>

                  <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
                    {items.map((item) => {
                      const isActive =
                        item.status === "confirmed" || item.status === "rescheduled";
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="flex min-w-0 items-start gap-3.5">
                            <div className="w-24 shrink-0 rounded-xl border border-stone-200 bg-[#fafaf9] px-2.5 py-2 text-center tabular-nums">
                              <div className="text-xs font-semibold text-[#1c1917]">
                                {formatTimeInTimezone(item.startUtc, timezone)}
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {item.durationMins} min
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-[#1c1917]">
                                  {item.serviceName}
                                </span>
                                <span className="font-mono text-[11px] text-stone-400">
                                  {item.bookingRef}
                                </span>
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                                    item.status === "confirmed"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : item.status === "rescheduled"
                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                        : item.status === "completed"
                                          ? "border-blue-200 bg-blue-50 text-[#1d4ed8]"
                                          : "border-stone-200 bg-stone-100 text-stone-500"
                                  }`}
                                >
                                  {item.status}
                                </span>
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                                    item.paymentStatus === "sandbox_paid"
                                      ? "border-blue-200 bg-blue-50 text-[#1d4ed8]"
                                      : item.paymentStatus === "refunded"
                                        ? "border-stone-200 bg-stone-100 text-stone-600"
                                        : "border-amber-200 bg-amber-50 text-amber-800"
                                  }`}
                                >
                                  {item.paymentStatus === "sandbox_paid"
                                    ? `Sandbox Paid · ${formatCurrency(item.paymentAmountCents)}`
                                    : item.paymentStatus === "refunded"
                                      ? `Refunded · ${formatCurrency(item.paymentAmountCents)}`
                                      : `Unpaid · ${formatCurrency(item.paymentAmountCents)}`}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-stone-600">
                                <strong className="font-medium text-[#1c1917]">
                                  {item.customerName}
                                </strong>{" "}
                                ({item.customerEmail}) · Specialist:{" "}
                                <strong className="font-medium text-[#1c1917]">
                                  {item.staffName}
                                </strong>
                              </p>
                              {item.notes && (
                                <p className="mt-1 text-xs text-stone-500">{item.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {isActive && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openReschedule(item)}
                                  disabled={mutatingId === item.id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1c1917] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
                                >
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  <span>Reschedule</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleComplete(item)}
                                  disabled={mutatingId === item.id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Complete</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancel(item)}
                                  disabled={mutatingId === item.id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Automated Reminders Queue */
        <section className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs">
          <div className="flex items-center justify-between border-b border-stone-100 p-4">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-[#2563eb]" />
              <h2 className="text-sm font-semibold text-[#1c1917]">
                Automated Email &amp; SMS Reminder Queue
              </h2>
            </div>
            <span className="text-xs text-stone-500">
              {reminders.filter((r) => r.status === "scheduled").length} scheduled ·{" "}
              {reminders.filter((r) => r.status === "sent").length} sent
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      rem.channel === "email"
                        ? "bg-blue-50 text-[#2563eb]"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {rem.channel === "email" ? (
                      <Mail className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-[#1c1917]">
                        {rem.channel}
                      </span>
                      <span className="font-mono text-[11px] text-stone-400">{rem.bookingRef}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                          rem.status === "sent"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-blue-200 bg-blue-50 text-[#1d4ed8]"
                        }`}
                      >
                        {rem.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-700">{rem.message}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-stone-500 tabular-nums">
                      <Clock className="h-3 w-3" />
                      Scheduled for {formatDateTimeInTimezone(rem.scheduledForUtc, timezone)} (
                      {timezone}) · {rem.customerName}
                    </p>
                  </div>
                </div>

                {rem.status === "scheduled" && (
                  <button
                    type="button"
                    onClick={() => handleMarkReminderSent(rem.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1c1917] hover:border-[#2563eb] hover:text-[#2563eb]"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Simulate Send</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reschedule Modal with Live Availability & Overlap Guard */}
      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#2563eb]">
                  Reschedule · {rescheduleTarget.bookingRef}
                </p>
                <h2 className="mt-0.5 text-lg font-semibold text-[#1c1917]">
                  {rescheduleTarget.serviceName}
                </h2>
                <p className="text-xs text-stone-500">
                  {rescheduleTarget.customerName} with {rescheduleTarget.staffName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRescheduleModal}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                aria-label="Close reschedule dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Choose New Date ({timezone})
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setRescheduleDate(nextDate);
                    setRescheduleSelectedUtc("");
                    setRescheduleSlots([]);
                    setRescheduleLoadedKey(null);
                    void loadRescheduleSlots(rescheduleTarget, nextDate);
                  }}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-stone-700">
                  Available Time Slots (Overlap Guard Active)
                </label>
                {rescheduleLoadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div key={n} className="h-10 animate-pulse rounded-xl bg-stone-100" />
                    ))}
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="rounded-xl border border-stone-200 bg-[#fafaf9] p-3 text-xs text-stone-600">
                    No availability windows on this date. Pick another date.
                  </p>
                ) : (
                  <div className="grid max-h-52 grid-cols-3 gap-2 overflow-y-auto">
                    {rescheduleSlots.map((slot) => {
                      const chosen = slot.startUtc === rescheduleSelectedUtc && slot.available;
                      return (
                        <button
                          key={slot.startUtc}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setRescheduleSelectedUtc(slot.startUtc)}
                          className={`rounded-xl border px-2.5 py-2 text-xs font-semibold tabular-nums ${
                            !slot.available
                              ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                              : chosen
                                ? "border-[#2563eb] bg-[#2563eb] text-white"
                                : "border-stone-200 bg-white text-[#1c1917] hover:border-[#2563eb]"
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {rescheduleError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{rescheduleError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRescheduleModal}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitReschedule}
                  disabled={!isRescheduleConfirmReady}
                  className="rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  {mutatingId === rescheduleTarget.id
                    ? "Validating Slot..."
                    : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
