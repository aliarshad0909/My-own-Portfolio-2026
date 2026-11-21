import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import {
  activityLogs,
  attendanceLogs,
  candidates,
  departments,
  employeeDocuments,
  employees,
  leaveRequests,
  onboardingTasks,
} from "@/db/schema";
import { requireApiUser } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();

  const [
    deptRows,
    empRows,
    leaveRows,
    candRows,
    taskRows,
    attRows,
    docRows,
    recentLogs,
  ] = await Promise.all([
    db.select().from(departments).orderBy(departments.name),
    db.select().from(employees),
    db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        employeeName: employees.fullName,
        employeeTitle: employees.title,
        leaveBalanceDays: employees.leaveBalanceDays,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        daysRequested: leaveRequests.daysRequested,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .innerJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .orderBy(desc(leaveRequests.createdAt)),
    db.select().from(candidates),
    db.select().from(onboardingTasks),
    db.select().from(attendanceLogs).orderBy(desc(attendanceLogs.logDate)),
    db.select().from(employeeDocuments),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),
  ]);

  const activeHeadcount = empRows.filter((e) => e.status !== "inactive").length;
  const onboardingCount = empRows.filter((e) => e.status === "onboarding").length;
  const onLeaveNow = empRows.filter((e) => e.status === "on_leave").length;

  const pendingLeaves = leaveRows.filter((l) => l.status === "pending");
  const openCandidates = candRows.filter((c) => c.stage !== "hired" && c.stage !== "archived");

  const completedTasks = taskRows.filter((t) => t.completed).length;
  const onboardingCompletionPct =
    taskRows.length > 0 ? Math.round((completedTasks / taskRows.length) * 100) : 100;

  // Attendance analytics (from latest logged date or all logs)
  const latestDate = attRows[0]?.logDate ?? null;
  const latestAttendance = latestDate ? attRows.filter((a) => a.logDate === latestDate) : [];
  const presentOrRemote = latestAttendance.filter((a) => a.status === "present" || a.status === "remote").length;
  const remoteCount = latestAttendance.filter((a) => a.status === "remote").length;
  const attendanceRatePct =
    latestAttendance.length > 0 ? Math.round((presentOrRemote / latestAttendance.length) * 100) : 0;
  const remoteSharePct =
    presentOrRemote > 0 ? Math.round((remoteCount / presentOrRemote) * 100) : 0;

  // Leave utilization (assuming baseline annual allowance of 20d)
  const totalAllowance = empRows.length * 20;
  const totalRemaining = empRows.reduce((sum, e) => sum + e.leaveBalanceDays, 0);
  const leaveUtilizationPct =
    totalAllowance > 0
      ? Math.max(0, Math.min(100, Math.round(((totalAllowance - totalRemaining) / totalAllowance) * 100)))
      : 0;

  const verifiedDocs = docRows.filter((d) => d.status === "verified").length;
  const compliancePct = docRows.length > 0 ? Math.round((verifiedDocs / docRows.length) * 100) : 100;

  const departmentBreakdown = deptRows.map((dept) => {
    const members = empRows.filter((e) => e.departmentId === dept.id);
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      headName: dept.headName,
      headcount: members.length,
      target: dept.headcountTarget,
      fillPct: Math.min(100, Math.round((members.length / Math.max(dept.headcountTarget, 1)) * 100)),
    };
  });

  return NextResponse.json({
    viewerRole: auth.user.role,
    kpis: {
      activeHeadcount,
      departmentsCount: deptRows.length,
      pendingLeaveApprovals: pendingLeaves.length,
      openCandidatesCount: openCandidates.length,
      onboardingCompletionPct,
      onboardingCount,
      onLeaveNow,
    },
    analytics: {
      latestAttendanceDate: latestDate,
      attendanceRatePct,
      remoteSharePct,
      leaveUtilizationPct,
      documentCompliancePct: compliancePct,
      totalAttendanceSamples: latestAttendance.length,
    },
    departmentBreakdown,
    pendingLeaveQueue: pendingLeaves.slice(0, 5),
    recentActivities: recentLogs,
  });
}
