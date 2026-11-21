"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useWorkspaceTimezone } from "@/components/AppShell";
import { useToast } from "@/components/ToastProvider";
import {
  SUPPORTED_TIMEZONES,
  formatCurrency,
  type SupportedTimezone,
} from "@/lib/constants";
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  getNextWeekdayDateKey,
} from "@/lib/timezone";

type ServiceItem = {
  id: string;
  name: string;
  category: string;
  durationMins: number;
  bufferMins: number;
  priceCents: number;
  currency: string;
  description: string;
  active: boolean;
};

type StaffItem = {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  timezone: string;
  bio: string;
  avatarColor: string;
  active: boolean;
};

type SlotItem = {
  startUtc: string;
  endUtc: string;
  label: string;
  staffLabel: string;
  available: boolean;
};

type ConfirmationPayload = {
  booking: {
    id: string;
    bookingRef: string;
    serviceName: string;
    durationMins: number;
    staffName: string;
    customerName: string;
    customerEmail: string;
    startUtc: string;
    endUtc: string;
    customerTimezone: string;
    paymentStatus: string;
    paymentAmountCents: number;
    paymentReceiptRef: string | null;
  };
  reminders: Array<{
    id: string;
    channel: string;
    scheduledForUtc: string;
    status: string;
    message: string;
  }>;
};

export function BookClient() {
  const { timezone, setTimezone } = useWorkspaceTimezone();
  const { pushToast } = useToast();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getNextWeekdayDateKey("America/New_York", 1),
  );
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotUtc, setSelectedSlotUtc] = useState<string>("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [simulateSandboxPayment, setSimulateSandboxPayment] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationPayload | null>(null);

  const loadCatalog = useCallback(async () => {
    const [svcRes, stfRes] = await Promise.all([fetch("/api/services"), fetch("/api/staff")]);
    if (svcRes.ok && stfRes.ok) {
      const svcJson = (await svcRes.json()) as { services: ServiceItem[] };
      const stfJson = (await stfRes.json()) as { staff: StaffItem[] };
      const activeServices = svcJson.services.filter((s) => s.active);
      const activeStaff = stfJson.staff.filter((s) => s.active);
      setServices(activeServices);
      setStaffList(activeStaff);
      setSelectedServiceId((prev) => prev || activeServices[0]?.id || "");
      setSelectedStaffId((prev) => prev || activeStaff[0]?.id || "");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0);
    const onRefresh = () => void loadCatalog();
    window.addEventListener("bookos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bookos:refresh", onRefresh);
    };
  }, [loadCatalog]);

  const loadSlots = useCallback(async () => {
    if (!selectedServiceId || !selectedStaffId || !selectedDate) return;
    setLoadingSlots(true);
    setConflictError(null);
    try {
      const params = new URLSearchParams({
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        date: selectedDate,
        timezone,
      });
      const res = await fetch(`/api/slots?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as { slots: SlotItem[] };
        setSlots(json.slots);
        setSelectedSlotUtc((prev) => {
          const stillOpen = json.slots.some((s) => s.startUtc === prev && s.available);
          if (stillOpen) return prev;
          return json.slots.find((s) => s.available)?.startUtc || "";
        });
      }
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedServiceId, selectedStaffId, selectedDate, timezone]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSlots(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSlots]);

  const selectedService = services.find((s) => s.id === selectedServiceId) ?? null;
  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) ?? null;
  const selectedSlot = slots.find((s) => s.startUtc === selectedSlotUtc) ?? null;

  async function handleConfirmBooking(e: FormEvent) {
    e.preventDefault();
    if (!selectedServiceId || !selectedStaffId || !selectedSlotUtc) {
      pushToast("error", "Please select a service, specialist, and an open time slot.");
      return;
    }

    setSubmitting(true);
    setConflictError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          staffId: selectedStaffId,
          startUtc: selectedSlotUtc,
          customerTimezone: timezone,
          customerName,
          customerEmail,
          customerPhone,
          notes,
          simulateSandboxPayment,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as ConfirmationPayload & {
        error?: string;
        code?: string;
      };

      if (res.status === 409) {
        setConflictError(data.error || "Selected time slot is no longer available — double booking prevented");
        pushToast("error", data.error || "Double booking prevented.");
        void loadSlots();
        return;
      }

      if (!res.ok) {
        pushToast("error", data.error || "Could not complete booking.");
        return;
      }

      setConfirmation(data);
      pushToast("success", `Booking ${data.booking.bookingRef} confirmed!`);
      void loadSlots();
    } catch {
      pushToast("error", "Network error while confirming booking.");
    } finally {
      setSubmitting(false);
    }
  }

  function startNewBooking() {
    setConfirmation(null);
    setConflictError(null);
    setNotes("");
    void loadSlots();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#2563eb] uppercase">
            Live Customer Booking Portal
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1917] sm:text-3xl">
            Schedule an Appointment
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Real-time availability computed from PostgreSQL rules minus active bookings with
            transactional overlap protection.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-[#1c1917] shadow-2xs">
          <Globe className="h-3.5 w-3.5 text-[#2563eb]" />
          <select
            aria-label="Booking timezone selector"
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

      {confirmation ? (
        <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Confirmed · {confirmation.booking.bookingRef}
              </span>
              <h2 className="mt-2 text-xl font-semibold text-[#1c1917]">
                Your appointment is locked in
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Saved to PostgreSQL and immediately visible in the Admin Calendar with automated
                reminders queued.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-[#fafaf9] p-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-xs text-stone-500">Service</span>
              <p className="font-semibold text-[#1c1917]">{confirmation.booking.serviceName}</p>
            </div>
            <div>
              <span className="text-xs text-stone-500">Specialist</span>
              <p className="font-semibold text-[#1c1917]">{confirmation.booking.staffName}</p>
            </div>
            <div>
              <span className="text-xs text-stone-500">Date &amp; Time ({confirmation.booking.customerTimezone})</span>
              <p className="font-semibold text-[#1c1917] tabular-nums">
                {formatDateInTimezone(confirmation.booking.startUtc, confirmation.booking.customerTimezone)}{" "}
                · {formatTimeInTimezone(confirmation.booking.startUtc, confirmation.booking.customerTimezone)}
              </p>
            </div>
            <div>
              <span className="text-xs text-stone-500">Sandbox Payment Status</span>
              <p className="font-semibold text-[#1d4ed8]">
                {confirmation.booking.paymentStatus === "sandbox_paid"
                  ? `Sandbox Paid (${formatCurrency(confirmation.booking.paymentAmountCents)})`
                  : `Pay at Studio (${formatCurrency(confirmation.booking.paymentAmountCents)})`}
              </p>
              {confirmation.booking.paymentReceiptRef && (
                <p className="font-mono text-[11px] text-stone-500">
                  Receipt: {confirmation.booking.paymentReceiptRef}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1d4ed8]">
              <BellRing className="h-4 w-4" />
              <span>Automated Reminders Scheduled ({confirmation.reminders.length})</span>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-stone-700">
              {confirmation.reminders.map((rem) => (
                <li key={rem.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <strong className="uppercase">{rem.channel}</strong> — {rem.message}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/calendar"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <CalendarDays className="h-4 w-4" />
              <span>View in Admin Calendar</span>
            </Link>
            <button
              type="button"
              onClick={startNewBooking}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-[#1c1917] hover:bg-stone-50"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left 8 Columns: Interactive 4-Step Flow */}
          <form onSubmit={handleConfirmBooking} className="space-y-6 lg:col-span-8">
            {/* Step 1: Choose Service */}
            <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
                  1
                </span>
                <h2 className="text-base font-semibold text-[#1c1917]">Choose a Service</h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((svc) => {
                  const selected = svc.id === selectedServiceId;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        selected
                          ? "border-[#2563eb] bg-blue-50/50 ring-1 ring-[#2563eb]"
                          : "border-stone-200 bg-[#fafaf9] hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-[#2563eb]">{svc.category}</span>
                        <span className="text-sm font-semibold text-[#1c1917] tabular-nums">
                          {formatCurrency(svc.priceCents, svc.currency)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#1c1917]">{svc.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                        {svc.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {svc.durationMins} min
                        </span>
                        <span>+{svc.bufferMins}m buffer</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Step 2: Select Staff & Date */}
            <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
                  2
                </span>
                <h2 className="text-base font-semibold text-[#1c1917]">
                  Select Specialist &amp; Date
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {staffList.map((member) => {
                  const selected = member.id === selectedStaffId;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedStaffId(member.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                        selected
                          ? "border-[#2563eb] bg-blue-50/50 ring-1 ring-[#2563eb]"
                          : "border-stone-200 bg-[#fafaf9] hover:border-stone-300 hover:bg-white"
                      }`}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1c1917]">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-stone-600">{member.roleTitle}</p>
                        <p className="mt-1 text-[11px] text-stone-500">Home TZ: {member.timezone}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-700">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-700">
                    Your Display Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value as SupportedTimezone)}
                    className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  >
                    {SUPPORTED_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Step 3: Live Available Slots */}
            <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
                    3
                  </span>
                  <h2 className="text-base font-semibold text-[#1c1917]">
                    Inspect Live Available Slots
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2563eb]" />
                  {slots.filter((s) => s.available).length} open / {slots.length} total
                </span>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="h-11 animate-pulse rounded-xl bg-stone-100" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-[#fafaf9] p-4 text-center text-xs text-stone-600">
                  No availability windows configured for{" "}
                  <strong>{selectedStaff?.name ?? "this specialist"}</strong> on {selectedDate}. Try
                  a weekday or adjust weekly availability rules in the Catalog.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {slots.map((slot) => {
                    const isSelected = slot.startUtc === selectedSlotUtc && slot.available;
                    return (
                      <button
                        key={slot.startUtc}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlotUtc(slot.startUtc)}
                        className={`rounded-xl border px-3 py-2.5 text-center transition-all tabular-nums ${
                          !slot.available
                            ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                            : isSelected
                              ? "border-[#2563eb] bg-[#2563eb] text-white shadow-xs"
                              : "border-stone-200 bg-white text-[#1c1917] hover:border-[#2563eb] hover:bg-blue-50/40"
                        }`}
                      >
                        <div className="text-sm font-semibold">{slot.label}</div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? "text-blue-100" : "text-stone-500"
                          }`}
                        >
                          {slot.available ? "Available" : "Booked"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {conflictError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{conflictError}</span>
                </div>
              )}
            </section>

            {/* Step 4: Customer Details + Sandbox Payment Simulation */}
            <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563eb] text-xs font-semibold text-white">
                  4
                </span>
                <h2 className="text-base font-semibold text-[#1c1917]">
                  Customer Details &amp; Sandbox Payment Simulation
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jordan Vance"
                    className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jordan@northstar.co"
                    className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-700">
                    Phone (for SMS reminders)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 (415) 555-0199"
                    className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-stone-700">
                    Session Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Goals or agenda items for this call..."
                    className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2.5 text-sm text-[#1c1917] focus:border-[#2563eb] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Sandbox Payment Simulation Toggle — ZERO real card inputs */}
              <div className="mt-5 rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563eb] shadow-2xs">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1c1917]">
                        Sandbox Payment Simulation (No Real Charge)
                      </p>
                      <p className="mt-0.5 text-xs text-stone-600">
                        Zero real credit cards or PCI data are collected. Toggle ON to issue a
                        simulated sandbox receipt immediately upon confirmation.
                      </p>
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]">
                    <input
                      type="checkbox"
                      checked={simulateSandboxPayment}
                      onChange={(e) => setSimulateSandboxPayment(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#2563eb]"
                    />
                    <span>{simulateSandboxPayment ? "Simulate Paid" : "Leave Unpaid"}</span>
                  </label>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !selectedSlotUtc}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <CalendarCheck2 className="h-4 w-4" />
                  <span>
                    {submitting
                      ? "Validating & Confirming..."
                      : simulateSandboxPayment
                        ? `Confirm & Simulate Pay (${selectedService ? formatCurrency(selectedService.priceCents) : "$0"})`
                        : "Confirm Appointment"}
                  </span>
                </button>
              </div>
            </section>
          </form>

          {/* Right 4 Columns: Live Booking Summary Card */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
                <h2 className="text-sm font-semibold text-[#1c1917]">Booking Summary</h2>
                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Service</span>
                    <span className="text-right font-semibold text-[#1c1917]">
                      {selectedService?.name ?? "Select a service"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Duration</span>
                    <span className="font-medium text-[#1c1917] tabular-nums">
                      {selectedService
                        ? `${selectedService.durationMins} min (+${selectedService.bufferMins}m buffer)`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Specialist</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#1c1917]">
                      <UserCheck className="h-3.5 w-3.5 text-[#2563eb]" />
                      {selectedStaff?.name ?? "Select specialist"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Selected Slot</span>
                    <span className="text-right font-semibold text-[#1d4ed8] tabular-nums">
                      {selectedSlot
                        ? `${selectedDate} · ${selectedSlot.label}`
                        : "Select an available time"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Timezone</span>
                    <span className="font-medium text-[#1c1917]">{timezone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold text-[#1c1917]">Sandbox Total</span>
                    <span className="text-lg font-semibold text-[#1c1917] tabular-nums">
                      {selectedService ? formatCurrency(selectedService.priceCents) : "$0"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200/80 bg-[#f5f5f4] p-4 text-xs text-stone-600">
                <div className="flex items-center gap-2 font-semibold text-[#1c1917]">
                  <ShieldCheck className="h-4 w-4 text-[#2563eb]" />
                  <span>Atomic Overlap Guard</span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  Every confirmation runs inside a PostgreSQL transaction locking the specialist
                  record and verifying zero intersecting non-cancelled bookings before writing.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
