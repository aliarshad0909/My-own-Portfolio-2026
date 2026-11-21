"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  Eye,
  FileCheck2,
  GitFork,
  Lock,
  Mail,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

type Department = {
  id: string;
  name: string;
  code: string;
  headName: string;
  headcountTarget: number;
  headcount?: number;
  onboardingCount?: number;
};

type SafeEmployee = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
  managerId: string | null;
  managerName?: string | null;
  employmentType: string;
  status: string;
  startDate: string;
  location: string;
  leaveBalanceDays: number;
  compensationBandPrivate: string | null;
  emergencyContactPrivate: string | null;
  hrNotesPrivate: string | null;
  privateFieldsRedacted: boolean;
};

type EmployeeDetailPayload = {
  viewerRole: string;
  employee: SafeEmployee;
  directReports: { id: string; fullName: string; title: string }[];
  documents: { id: string; title: string; docType: string; status: string; uploadedDate: string }[];
  onboardingTasks: { id: string; title: string; ownerRole: string; completed: boolean }[];
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-100 text-[#15803d]",
  on_leave: "bg-amber-100 text-amber-800",
  onboarding: "bg-sky-100 text-sky-800",
};

export default function DirectoryPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"directory" | "org" | "departments">("directory");
  const [employees, setEmployees] = useState<SafeEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [viewerRole, setViewerRole] = useState("demo");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Drawer state
  const [selectedDetail, setSelectedDetail] = useState<EmployeeDetailPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add Employee Modal
  const [addEmpOpen, setAddEmpOpen] = useState(false);
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empForm, setEmpForm] = useState(() => ({
    fullName: "",
    email: "",
    title: "",
    departmentId: "",
    managerId: "",
    employmentType: "full_time",
    status: "onboarding",
    startDate: new Date().toISOString().slice(0, 10),
    location: "Austin, TX (Hybrid)",
    leaveBalanceDays: "18",
    compensationBandPrivate: "Band L4 · $120,000 – $134,000 (Fictional Demo Band)",
    emergencyContactPrivate: "Fictional Contact · +1 (512) 555-0190",
    hrNotesPrivate: "",
  }));

  // Add Department Form
  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    headName: "",
    headcountTarget: "6",
  });
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (deptFilter) params.set("departmentId", deptFilter);
      if (statusFilter) params.set("status", statusFilter);

      const [empRes, deptRes] = await Promise.all([
        fetch(`/api/employees?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/departments", { cache: "no-store" }),
      ]);

      if (empRes.ok) {
        const empJson = await empRes.json();
        setEmployees(empJson.employees ?? []);
        setViewerRole(empJson.viewerRole ?? "demo");
      }
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        setDepartments(deptJson.departments ?? []);
        setEmpForm((prev) =>
          prev.departmentId || !(deptJson.departments?.length > 0)
            ? prev
            : { ...prev, departmentId: deptJson.departments[0].id },
        );
      }
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const onRefresh = () => {
      setSelectedDetail(null);
      void load();
    };
    window.addEventListener("peopleos:refresh", onRefresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("peopleos:refresh", onRefresh);
    };
  }, [load]);

  async function openProfile(empId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/employees/${empId}`, { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as EmployeeDetailPayload;
        setSelectedDetail(json);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAddEmployee(e: FormEvent) {
    e.preventDefault();
    setEmpSubmitting(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...empForm,
          managerId: empForm.managerId || null,
          leaveBalanceDays: Number(empForm.leaveBalanceDays),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to create employee.", "error");
        return;
      }
      toast(`Added ${json.employee?.fullName} to PeopleOS directory.`, "success");
      setAddEmpOpen(false);
      setEmpForm((prev) => ({
        ...prev,
        fullName: "",
        email: "",
        title: "",
        hrNotesPrivate: "",
      }));
      await load();
    } finally {
      setEmpSubmitting(false);
    }
  }

  async function handleAddDepartment(e: FormEvent) {
    e.preventDefault();
    setDeptSubmitting(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...deptForm,
          headcountTarget: Number(deptForm.headcountTarget),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Unable to create department.", "error");
        return;
      }
      toast(`Created department ${json.department?.name}.`, "success");
      setDeptForm({ name: "", code: "", headName: "", headcountTarget: "6" });
      await load();
    } finally {
      setDeptSubmitting(false);
    }
  }

  // Build Org Chart roots (employees with no manager or manager not in current set)
  const employeeIds = new Set(employees.map((e) => e.id));
  const orgRoots = employees.filter((e) => !e.managerId || !employeeIds.has(e.managerId));

  function renderOrgNode(node: SafeEmployee, depth = 0) {
    const reports = employees.filter((e) => e.managerId === node.id);
    return (
      <div key={node.id} className={depth > 0 ? "ml-4 border-l-2 border-green-200 pl-4 sm:ml-7 sm:pl-5" : ""}>
        <button
          type="button"
          onClick={() => void openProfile(node.id)}
          className="mb-3 flex w-full max-w-xl items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-2xs transition hover:border-[#16a34a]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e293b] text-xs font-bold text-white">
              {node.fullName
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{node.fullName}</p>
              <p className="truncate text-xs text-slate-600">
                {node.title} · <span className="font-medium text-[#15803d]">{node.departmentName}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {reports.length > 0 ? (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                {reports.length} report{reports.length === 1 ? "" : "s"}
              </span>
            ) : null}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[node.status] ?? "bg-slate-100 text-slate-700"}`}>
              {node.status.replace("_", " ")}
            </span>
          </div>
        </button>

        {reports.length > 0 ? (
          <div className="space-y-1">{reports.map((child) => renderOrgNode(child, depth + 1))}</div>
        ) : null}
      </div>
    );
  }

  const canManage = viewerRole === "admin" || viewerRole === "demo";

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Employee Directory, Profiles &amp; Org Chart
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search fictional team members, inspect RBAC-protected profiles, explore reporting trees, and manage departments.
          </p>
        </div>

        <button
          type="button"
          disabled={!canManage}
          onClick={() => setAddEmpOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="inline-flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1">
          {[
            { id: "directory", label: "Directory", icon: Users },
            { id: "org", label: "Org Chart", icon: GitFork },
            { id: "departments", label: "Departments", icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-[#1e293b] text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
          <Lock className="h-3.5 w-3.5 text-[#16a34a]" />
          <span>
            Active RBAC Policy:{" "}
            <strong className="text-slate-900">
              {viewerRole === "employee"
                ? "Peer PII Redacted (Self Only)"
                : viewerRole === "manager"
                  ? "Own + Direct Reports PII"
                  : "Full HR Private Access"}
            </strong>
          </span>
        </div>
      </div>

      {/* TAB 1: Employee Directory */}
      {tab === "directory" ? (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, title, code, location, or email…"
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-[#16a34a] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <select
                aria-label="Filter by department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#16a34a] focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#16a34a] focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-[#f6f8f7] text-[11px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Manager</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Leave Bal.</th>
                    <th className="px-4 py-3">Private Band (RBAC)</th>
                    <th className="px-4 py-3 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#f6f8f7]/70">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{emp.fullName}</p>
                        <p className="text-[11px] text-slate-500">
                          {emp.employeeCode} · {emp.title}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{emp.departmentName}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.managerName ?? "Executive"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[emp.status] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {emp.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{emp.leaveBalanceDays}d</td>
                      <td className="px-4 py-3">
                        {emp.privateFieldsRedacted ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            <Lock className="h-3 w-3" />
                            Redacted
                          </span>
                        ) : (
                          <span className="block max-w-[190px] truncate text-[11px] text-slate-700">
                            {emp.compensationBandPrivate}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void openProfile(emp.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-[#16a34a] hover:text-[#15803d]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No matching employees found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 2: Visual Organizational Structure Tree */}
      {tab === "org" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Organizational Reporting Tree</h2>
            <p className="text-xs text-slate-500">
              Manager → Direct Reports hierarchy. Click any employee card to inspect their RBAC-governed profile drawer.
            </p>
          </div>
          <div className="space-y-4">
            {orgRoots.map((root) => renderOrgNode(root, 0))}
          </div>
        </section>
      ) : null}

      {/* TAB 3: Department Management */}
      {tab === "departments" ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <section className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {departments.map((dept) => (
              <div key={dept.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-green-50 px-2 py-0.5 font-mono text-[11px] font-bold text-[#15803d]">
                      {dept.code}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-500">Department Head: {dept.headName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{dept.headcount ?? 0}</p>
                    <p className="text-[11px] text-slate-500">Target {dept.headcountTarget}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs lg:col-span-4">
            <h2 className="text-base font-bold text-slate-900">Create Department</h2>
            <p className="mt-1 text-xs text-slate-500">Add a new organizational unit and target headcount.</p>
            <form onSubmit={handleAddDepartment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Department Name</label>
                <input
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Data Platform"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#16a34a] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Code</label>
                  <input
                    required
                    maxLength={8}
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    placeholder="DATA"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Target Size</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={500}
                    value={deptForm.headcountTarget}
                    onChange={(e) => setDeptForm({ ...deptForm, headcountTarget: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">Department Head</label>
                <input
                  required
                  value={deptForm.headName}
                  onChange={(e) => setDeptForm({ ...deptForm, headName: e.target.value })}
                  placeholder="e.g. Hannah Reyes"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-[#16a34a] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!canManage || deptSubmitting}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{deptSubmitting ? "Saving…" : "Create Department"}</span>
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {/* Employee Profile Drawer */}
      {selectedDetail || detailLoading ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50"
          role="dialog"
          aria-modal="true"
          aria-label="Employee profile drawer"
        >
          <button
            type="button"
            aria-label="Close drawer backdrop"
            className="flex-1"
            onClick={() => setSelectedDetail(null)}
          />
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            {detailLoading || !selectedDetail ? (
              <p className="text-xs text-slate-500">Loading employee profile…</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-[#15803d]">
                      {selectedDetail.employee.employeeCode}
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedDetail.employee.fullName}
                    </h2>
                    <p className="text-xs text-slate-600">
                      {selectedDetail.employee.title} · {selectedDetail.employee.departmentName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDetail(null)}
                    aria-label="Close profile drawer"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Public Profile Facts */}
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-[#f6f8f7] p-3.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{selectedDetail.employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate">{selectedDetail.employee.location}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase">Manager</span>
                    <span className="font-medium text-slate-900">
                      {selectedDetail.employee.managerName ?? "Executive Leadership"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-500 uppercase">Leave Balance</span>
                    <span className="font-bold text-[#15803d]">
                      {selectedDetail.employee.leaveBalanceDays} days remaining
                    </span>
                  </div>
                </div>

                {/* RBAC-Protected Private HR Fields */}
                <div
                  className={`rounded-xl border p-4 text-xs ${
                    selectedDetail.employee.privateFieldsRedacted
                      ? "border-amber-200 bg-amber-50/70"
                      : "border-green-200 bg-green-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-bold text-slate-900">
                      {selectedDetail.employee.privateFieldsRedacted ? (
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-[#16a34a]" />
                      )}
                      <span>Private HR Record (RBAC Guarded)</span>
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                      Role: {selectedDetail.viewerRole}
                    </span>
                  </div>

                  {selectedDetail.employee.privateFieldsRedacted ? (
                    <p className="mt-2.5 leading-relaxed text-amber-900">
                      <strong>Redacted by server RBAC policy:</strong> Compensation band, emergency contact, and
                      confidential HR notes are stripped from the API response because your active role (
                      <code>{selectedDetail.viewerRole}</code>) cannot inspect another employee&apos;s private HR
                      records.
                    </p>
                  ) : (
                    <dl className="mt-3 space-y-2.5">
                      <div>
                        <dt className="text-[10px] font-semibold text-slate-500 uppercase">
                          Compensation Band (Fictional)
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-900">
                          {selectedDetail.employee.compensationBandPrivate}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold text-slate-500 uppercase">
                          Emergency Contact (Fictional)
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-900">
                          {selectedDetail.employee.emergencyContactPrivate}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold text-slate-500 uppercase">HR Notes</dt>
                        <dd className="mt-0.5 text-slate-700">
                          {selectedDetail.employee.hrNotesPrivate || "No HR notes recorded."}
                        </dd>
                      </div>
                    </dl>
                  )}
                </div>

                {/* Direct Reports */}
                {selectedDetail.directReports.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Direct Reports ({selectedDetail.directReports.length})
                    </h3>
                    <div className="mt-2 space-y-1.5">
                      {selectedDetail.directReports.map((rep) => (
                        <button
                          key={rep.id}
                          type="button"
                          onClick={() => void openProfile(rep.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-xs hover:border-[#16a34a]"
                        >
                          <span className="font-semibold text-slate-900">{rep.fullName}</span>
                          <span className="text-slate-500">{rep.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Employee Documents */}
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                    <FileCheck2 className="h-3.5 w-3.5 text-[#16a34a]" />
                    <span>Compliance Documents ({selectedDetail.documents.length})</span>
                  </h3>
                  <div className="mt-2 space-y-2">
                    {selectedDetail.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{doc.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.docType.replace("_", " ")} · {doc.uploadedDate}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            doc.status === "verified"
                              ? "bg-green-100 text-[#15803d]"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    ))}
                    {selectedDetail.documents.length === 0 ? (
                      <p className="text-xs text-slate-500">No compliance documents uploaded yet.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Add Employee Modal */}
      {addEmpOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add new employee"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Fictional Employee Record</h2>
              <button
                type="button"
                onClick={() => setAddEmpOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="mt-4 space-y-3 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700">Full Name</label>
                  <input
                    required
                    value={empForm.fullName}
                    onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                    placeholder="e.g. Jordan Kim"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Work Email</label>
                  <input
                    required
                    type="email"
                    value={empForm.email}
                    onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                    placeholder="jordan.kim@peopleos.studio"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Job Title</label>
                  <input
                    required
                    value={empForm.title}
                    onChange={(e) => setEmpForm({ ...empForm, title: e.target.value })}
                    placeholder="Product Engineer"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Department</label>
                  <select
                    required
                    value={empForm.departmentId}
                    onChange={(e) => setEmpForm({ ...empForm, departmentId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Manager</label>
                  <select
                    value={empForm.managerId}
                    onChange={(e) => setEmpForm({ ...empForm, managerId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  >
                    <option value="">None (Executive)</option>
                    {employees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.title})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Status</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  >
                    <option value="onboarding">Onboarding (auto-creates checklist)</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Start Date</label>
                  <input
                    required
                    type="date"
                    value={empForm.startDate}
                    onChange={(e) => setEmpForm({ ...empForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Location</label>
                  <input
                    required
                    value={empForm.location}
                    onChange={(e) => setEmpForm({ ...empForm, location: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-[#16a34a] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-[#f6f8f7] p-3">
                <p className="mb-2 text-[11px] font-bold text-slate-700">
                  Private HR Fields (RBAC Redacted for Standard Employees)
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-slate-700">Compensation Band</label>
                    <input
                      required
                      value={empForm.compensationBandPrivate}
                      onChange={(e) => setEmpForm({ ...empForm, compensationBandPrivate: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Emergency Contact</label>
                    <input
                      required
                      value={empForm.emergencyContactPrivate}
                      onChange={(e) => setEmpForm({ ...empForm, emergencyContactPrivate: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddEmpOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={empSubmitting}
                  className="rounded-lg bg-[#16a34a] px-4 py-2 font-semibold text-white hover:bg-[#15803d] disabled:opacity-50"
                >
                  {empSubmitting ? "Creating…" : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
