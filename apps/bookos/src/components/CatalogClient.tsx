"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Briefcase,
  CalendarRange,
  Clock,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import {
  AVATAR_COLORS,
  DAY_NAMES,
  SERVICE_CATEGORIES,
  SUPPORTED_TIMEZONES,
  formatCurrency,
} from "@/lib/constants";

type ServiceRecord = {
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

type AvailabilityRule = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type StaffRecord = {
  id: string;
  name: string;
  roleTitle: string;
  email: string;
  timezone: string;
  bio: string;
  avatarColor: string;
  active: boolean;
  availabilityRules: AvailabilityRule[];
};

type DayRuleDraft = {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function buildDayDrafts(rules: AvailabilityRule[]): DayRuleDraft[] {
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const match = rules.find((r) => r.dayOfWeek === dow);
    return {
      dayOfWeek: dow,
      enabled: Boolean(match),
      startTime: match?.startTime ?? "09:00",
      endTime: match?.endTime ?? "17:00",
    };
  });
}

export function CatalogClient() {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<"services" | "staff" | "availability">("services");

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Service modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceRecord | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcCategory, setSvcCategory] = useState<string>(SERVICE_CATEGORIES[0]);
  const [svcDuration, setSvcDuration] = useState("45");
  const [svcBuffer, setSvcBuffer] = useState("15");
  const [svcPriceDollars, setSvcPriceDollars] = useState("180");
  const [svcDescription, setSvcDescription] = useState("");

  // Staff modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [stfName, setStfName] = useState("");
  const [stfRole, setStfRole] = useState("");
  const [stfEmail, setStfEmail] = useState("");
  const [stfTimezone, setStfTimezone] = useState("America/New_York");
  const [stfBio, setStfBio] = useState("");
  const [stfColor, setStfColor] = useState<string>(AVATAR_COLORS[0]);

  // Weekly availability editor
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [dayDrafts, setDayDrafts] = useState<DayRuleDraft[]>(() => buildDayDrafts([]));
  const [savingRules, setSavingRules] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, stfRes] = await Promise.all([fetch("/api/services"), fetch("/api/staff")]);
      if (svcRes.ok) {
        const j = (await svcRes.json()) as { services: ServiceRecord[] };
        setServices(j.services);
      }
      if (stfRes.ok) {
        const j = (await stfRes.json()) as { staff: StaffRecord[] };
        setStaffList(j.staff);
        setSelectedStaffId((prev) => {
          const activeId = prev && j.staff.some((s) => s.id === prev) ? prev : j.staff[0]?.id || "";
          const member = j.staff.find((s) => s.id === activeId);
          if (member) {
            setDayDrafts(buildDayDrafts(member.availabilityRules));
          }
          return activeId;
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAll(), 0);
    const onRefresh = () => void loadAll();
    window.addEventListener("bookos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("bookos:refresh", onRefresh);
    };
  }, [loadAll]);

  function openNewService() {
    setEditingService(null);
    setSvcName("");
    setSvcCategory(SERVICE_CATEGORIES[0]);
    setSvcDuration("45");
    setSvcBuffer("15");
    setSvcPriceDollars("180");
    setSvcDescription("");
    setServiceModalOpen(true);
  }

  function openEditService(svc: ServiceRecord) {
    setEditingService(svc);
    setSvcName(svc.name);
    setSvcCategory(svc.category);
    setSvcDuration(String(svc.durationMins));
    setSvcBuffer(String(svc.bufferMins));
    setSvcPriceDollars(String(Math.round(svc.priceCents / 100)));
    setSvcDescription(svc.description);
    setServiceModalOpen(true);
  }

  async function saveService(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: svcName,
      category: svcCategory,
      durationMins: Number(svcDuration),
      bufferMins: Number(svcBuffer),
      priceCents: Math.round(Number(svcPriceDollars) * 100),
      description: svcDescription,
    };

    const url = editingService ? `/api/services/${editingService.id}` : "/api/services";
    const method = editingService ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      pushToast("error", data.error || "Could not save service.");
      return;
    }
    pushToast("success", editingService ? "Service updated." : "New service created.");
    setServiceModalOpen(false);
    void loadAll();
  }

  async function toggleServiceActive(svc: ServiceRecord) {
    const res = await fetch(`/api/services/${svc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !svc.active }),
    });
    if (res.ok) {
      pushToast("info", `${svc.name} ${svc.active ? "paused" : "activated"}.`);
      void loadAll();
    }
  }

  async function deleteService(svc: ServiceRecord) {
    const res = await fetch(`/api/services/${svc.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      pushToast("error", data.error || "Could not delete service.");
      return;
    }
    pushToast("success", `Deleted ${svc.name}.`);
    void loadAll();
  }

  function openNewStaff() {
    setEditingStaff(null);
    setStfName("");
    setStfRole("");
    setStfEmail("");
    setStfTimezone("America/New_York");
    setStfBio("");
    setStfColor(AVATAR_COLORS[0]);
    setStaffModalOpen(true);
  }

  function openEditStaff(member: StaffRecord) {
    setEditingStaff(member);
    setStfName(member.name);
    setStfRole(member.roleTitle);
    setStfEmail(member.email);
    setStfTimezone(member.timezone);
    setStfBio(member.bio);
    setStfColor(member.avatarColor);
    setStaffModalOpen(true);
  }

  async function saveStaff(e: FormEvent) {
    e.preventDefault();
    const payload = {
      name: stfName,
      roleTitle: stfRole,
      email: stfEmail,
      timezone: stfTimezone,
      bio: stfBio,
      avatarColor: stfColor,
    };
    const url = editingStaff ? `/api/staff/${editingStaff.id}` : "/api/staff";
    const method = editingStaff ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      pushToast("error", data.error || "Could not save specialist.");
      return;
    }
    pushToast("success", editingStaff ? "Specialist updated." : "New specialist added.");
    setStaffModalOpen(false);
    void loadAll();
  }

  async function deleteStaff(member: StaffRecord) {
    const res = await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      pushToast("error", data.error || "Could not delete specialist.");
      return;
    }
    pushToast("success", `Removed ${member.name}.`);
    void loadAll();
  }

  function handleSelectStaffForRules(id: string) {
    setSelectedStaffId(id);
    const member = staffList.find((s) => s.id === id);
    if (member) {
      setDayDrafts(buildDayDrafts(member.availabilityRules));
    }
  }

  async function saveAvailabilityRules() {
    if (!selectedStaffId) return;
    setSavingRules(true);
    try {
      const rules = dayDrafts
        .filter((d) => d.enabled)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
        }));

      const res = await fetch(`/api/staff/${selectedStaffId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        pushToast("error", data.error || "Could not save availability rules.");
        return;
      }
      pushToast("success", "Weekly availability rules saved to PostgreSQL.");
      void loadAll();
    } finally {
      setSavingRules(false);
    }
  }

  const activeStaffRecord = staffList.find((s) => s.id === selectedStaffId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#2563eb] uppercase">
            Studio Configuration
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#1c1917] sm:text-3xl">
            Services, Staff &amp; Availability
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Configure bookable services, specialist profiles, and weekly working hours that power
            live slot calculation.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-2xs">
          {[
            { key: "services" as const, label: "Services", icon: Briefcase },
            { key: "staff" as const, label: "Staff", icon: Users },
            { key: "availability" as const, label: "Availability", icon: CalendarRange },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tab === t.key
                    ? "bg-[#2563eb] text-white"
                    : "text-stone-600 hover:text-[#1c1917]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SERVICES TAB */}
      {tab === "services" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1c1917]">
              Service Catalogue ({services.length})
            </h2>
            <button
              type="button"
              onClick={openNewService}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Service</span>
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 animate-pulse rounded-2xl bg-stone-200/60" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-[#2563eb]">{svc.category}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          svc.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-stone-200 bg-stone-100 text-stone-500"
                        }`}
                      >
                        {svc.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-[#1c1917]">{svc.name}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-stone-600">
                      {svc.description}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-stone-100 pt-3.5">
                    <div className="flex items-center justify-between text-xs tabular-nums">
                      <span className="inline-flex items-center gap-1 text-stone-600">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {svc.durationMins}m + {svc.bufferMins}m buffer
                      </span>
                      <span className="text-sm font-semibold text-[#1c1917]">
                        {formatCurrency(svc.priceCents, svc.currency)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleServiceActive(svc)}
                        className="text-xs font-medium text-stone-600 hover:text-[#2563eb]"
                      >
                        {svc.active ? "Pause" : "Activate"}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditService(svc)}
                          className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-[#1c1917]"
                          aria-label={`Edit ${svc.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteService(svc)}
                          className="rounded-lg p-1.5 text-stone-500 hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Delete ${svc.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* STAFF TAB */}
      {tab === "staff" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1c1917]">
              Staff Specialists ({staffList.length})
            </h2>
            <button
              type="button"
              onClick={openNewStaff}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add Specialist</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {staffList.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                      style={{ backgroundColor: member.avatarColor }}
                    >
                      {member.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-[#1c1917]">
                        {member.name}
                      </h3>
                      <p className="truncate text-xs text-stone-600">{member.roleTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditStaff(member)}
                      className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-[#1c1917]"
                      aria-label={`Edit ${member.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaff(member)}
                      className="rounded-lg p-1.5 text-stone-500 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${member.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-stone-600">{member.bio}</p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-stone-500">
                  <span>{member.email}</span>
                  <span className="rounded-full bg-[#f5f5f4] px-2.5 py-0.5 font-medium text-stone-700">
                    {member.timezone} · {member.availabilityRules.length} days/wk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AVAILABILITY RULES TAB */}
      {tab === "availability" && (
        <section className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-2xs">
          <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#1c1917]">
                Weekly Availability Rules
              </h2>
              <p className="text-xs text-stone-500">
                Working hours are interpreted in the specialist&apos;s home timezone (
                {activeStaffRecord?.timezone ?? "—"}).
              </p>
            </div>

            <select
              aria-label="Select specialist for availability rules"
              value={selectedStaffId}
              onChange={(e) => handleSelectStaffForRules(e.target.value)}
              className="rounded-xl border border-stone-200 bg-[#fafaf9] px-3.5 py-2 text-xs font-semibold text-[#1c1917] focus:border-[#2563eb] focus:outline-none"
            >
              {staffList.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.timezone})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 divide-y divide-stone-100">
            {dayDrafts.map((draft, idx) => (
              <div
                key={draft.dayOfWeek}
                className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="inline-flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => {
                      const next = [...dayDrafts];
                      next[idx] = { ...draft, enabled: e.target.checked };
                      setDayDrafts(next);
                    }}
                    className="h-4 w-4 rounded accent-[#2563eb]"
                  />
                  <span className="w-24 text-sm font-medium text-[#1c1917]">
                    {DAY_NAMES[draft.dayOfWeek]}
                  </span>
                </label>

                {draft.enabled ? (
                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="time"
                      value={draft.startTime}
                      onChange={(e) => {
                        const next = [...dayDrafts];
                        next[idx] = { ...draft, startTime: e.target.value };
                        setDayDrafts(next);
                      }}
                      className="rounded-lg border border-stone-200 bg-[#fafaf9] px-2.5 py-1.5 font-medium text-[#1c1917] tabular-nums"
                    />
                    <span className="text-stone-400">to</span>
                    <input
                      type="time"
                      value={draft.endTime}
                      onChange={(e) => {
                        const next = [...dayDrafts];
                        next[idx] = { ...draft, endTime: e.target.value };
                        setDayDrafts(next);
                      }}
                      className="rounded-lg border border-stone-200 bg-[#fafaf9] px-2.5 py-1.5 font-medium text-[#1c1917] tabular-nums"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-stone-400">Unavailable</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveAvailabilityRules}
              disabled={savingRules || !selectedStaffId}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingRules ? "Saving Rules..." : "Save Weekly Schedule"}</span>
            </button>
          </div>
        </section>
      )}

      {/* Service CRUD Modal */}
      {serviceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveService}
            className="w-full max-w-md space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1c1917]">
                {editingService ? "Edit Service" : "Add Service"}
              </h2>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">Service Name</label>
              <input
                required
                value={svcName}
                onChange={(e) => setSvcName(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                placeholder="Architecture Advisory"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Category</label>
                <select
                  value={svcCategory}
                  onChange={(e) => setSvcCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Price (USD)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={svcPriceDollars}
                  onChange={(e) => setSvcPriceDollars(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Duration (mins)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  required
                  value={svcDuration}
                  onChange={(e) => setSvcDuration(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">
                  Buffer (mins)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  required
                  value={svcBuffer}
                  onChange={(e) => setSvcBuffer(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">Description</label>
              <textarea
                rows={3}
                value={svcDescription}
                onChange={(e) => setSvcDescription(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Save Service
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff CRUD Modal */}
      {staffModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={saveStaff}
            className="w-full max-w-md space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1c1917]">
                {editingStaff ? "Edit Specialist" : "Add Specialist"}
              </h2>
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Full Name</label>
                <input
                  required
                  value={stfName}
                  onChange={(e) => setStfName(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Role Title</label>
                <input
                  required
                  value={stfRole}
                  onChange={(e) => setStfRole(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Email</label>
                <input
                  type="email"
                  required
                  value={stfEmail}
                  onChange={(e) => setStfEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-700">Timezone</label>
                <select
                  value={stfTimezone}
                  onChange={(e) => setStfTimezone(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">Avatar Accent</label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setStfColor(color)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      stfColor === color ? "border-[#1c1917] scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Pick color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-stone-700">Bio</label>
              <textarea
                rows={2}
                value={stfBio}
                onChange={(e) => setStfBio(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-[#fafaf9] px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStaffModalOpen(false)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Save Specialist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
