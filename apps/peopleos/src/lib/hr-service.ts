import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { activityLogs, attendanceLogs, employees, leaveRequests } from "@/db/schema";

export type RawEmployeeRecord = {
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
  compensationBandPrivate: string;
  emergencyContactPrivate: string;
  hrNotesPrivate: string;
  createdAt?: Date | string;
};

export type ViewerSafeEmployee = Omit<
  RawEmployeeRecord,
  "compensationBandPrivate" | "emergencyContactPrivate" | "hrNotesPrivate"
> & {
  compensationBandPrivate: string | null;
  emergencyContactPrivate: string | null;
  hrNotesPrivate: string | null;
  privateFieldsRedacted: boolean;
};

export type ViewerContext = {
  role: string;
  viewerEmployeeId: string | null;
  directReportIds?: Set<string>;
};

/**
 * Enforces Role-Based Access Control (RBAC) PII redaction on employee profiles.
 * - admin / demo: full HR access to private compensation, emergency contacts & HR notes.
 * - manager: full access to own profile and direct reports; redacts private fields for other employees.
 * - employee: full access ONLY to own profile; strictly redacts private fields for all other employees.
 */
export function sanitizeEmployeeForViewer(
  employee: RawEmployeeRecord,
  viewer: ViewerContext,
): ViewerSafeEmployee {
  const isHrPrivileged = viewer.role === "admin" || viewer.role === "demo";
  const isSelf = Boolean(viewer.viewerEmployeeId && viewer.viewerEmployeeId === employee.id);
  const isDirectReport =
    viewer.role === "manager" && Boolean(viewer.directReportIds?.has(employee.id));

  if (isHrPrivileged || isSelf || isDirectReport) {
    return {
      ...employee,
      privateFieldsRedacted: false,
    };
  }

  return {
    ...employee,
    compensationBandPrivate: null,
    emergencyContactPrivate: null,
    hrNotesPrivate: null,
    privateFieldsRedacted: true,
  };
}

/**
 * Generates inclusive YYYY-MM-DD calendar date strings between startDate and endDate.
 */
export function enumerateLeaveDates(startDate: string, endDate: string, maxDays = 30): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [startDate];
  }

  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end && dates.length < maxDays) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates.length > 0 ? dates : [startDate];
}

export class LeaveReviewError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "LeaveReviewError";
    this.statusCode = statusCode;
  }
}

export type LeaveReviewResult = {
  leaveRequestId: string;
  employeeId: string;
  status: "approved" | "rejected";
  daysRequested: number;
  remainingBalanceDays: number;
  attendanceDatesLogged: string[];
};

/**
 * Atomically approves or rejects a pending leave request inside ONE PostgreSQL transaction.
 * On approval:
 *   1. Validates request is pending and employee has sufficient leave_balance_days.
 *   2. Updates leave_requests.status = 'approved', reviewed_by, reviewed_at.
 *   3. Deducts days_requested from employees.leave_balance_days.
 *   4. Upserts 'on_leave' entries in attendance_logs for every date in the leave window.
 *   5. Records an audit entry in activity_logs.
 * On rejection:
 *   1. Updates leave_requests.status = 'rejected' without altering balance or attendance_logs.
 */
export async function reviewLeaveRequestTx(
  db: AppDatabase,
  input: {
    leaveRequestId: string;
    decision: "approved" | "rejected";
    reviewerName: string;
  },
): Promise<LeaveReviewResult> {
  return db.transaction(async (tx) => {
    const [requestRow] = await tx
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, input.leaveRequestId))
      .limit(1);

    if (!requestRow) {
      throw new LeaveReviewError("Leave request not found.", 404);
    }

    if (requestRow.status !== "pending") {
      throw new LeaveReviewError(
        `Leave request has already been ${requestRow.status}.`,
        409,
      );
    }

    const [employee] = await tx
      .select()
      .from(employees)
      .where(eq(employees.id, requestRow.employeeId))
      .limit(1);

    if (!employee) {
      throw new LeaveReviewError("Associated employee record not found.", 404);
    }

    const now = new Date();

    if (input.decision === "rejected") {
      await tx
        .update(leaveRequests)
        .set({
          status: "rejected",
          reviewedBy: input.reviewerName,
          reviewedAt: now,
        })
        .where(eq(leaveRequests.id, requestRow.id));

      await tx.insert(activityLogs).values({
        actorName: input.reviewerName,
        action: "leave.rejected",
        entityType: "leave_request",
        entityId: requestRow.id,
        summary: `Rejected ${requestRow.daysRequested}-day ${requestRow.leaveType} leave request for ${employee.fullName}. Balance unchanged (${employee.leaveBalanceDays}d).`,
      });

      return {
        leaveRequestId: requestRow.id,
        employeeId: employee.id,
        status: "rejected",
        daysRequested: requestRow.daysRequested,
        remainingBalanceDays: employee.leaveBalanceDays,
        attendanceDatesLogged: [],
      };
    }

    // Approval path: validate sufficient balance before deducting
    if (employee.leaveBalanceDays < requestRow.daysRequested) {
      throw new LeaveReviewError(
        `Insufficient leave balance: ${employee.fullName} has ${employee.leaveBalanceDays} day(s) remaining, but requested ${requestRow.daysRequested} day(s).`,
        409,
      );
    }

    const newBalance = employee.leaveBalanceDays - requestRow.daysRequested;
    const leaveDates = enumerateLeaveDates(
      requestRow.startDate,
      requestRow.endDate,
      Math.max(requestRow.daysRequested, 1),
    ).slice(0, Math.max(requestRow.daysRequested, 1));

    await tx
      .update(leaveRequests)
      .set({
        status: "approved",
        reviewedBy: input.reviewerName,
        reviewedAt: now,
      })
      .where(eq(leaveRequests.id, requestRow.id));

    await tx
      .update(employees)
      .set({
        leaveBalanceDays: newBalance,
      })
      .where(eq(employees.id, employee.id));

    for (const logDate of leaveDates) {
      await tx
        .insert(attendanceLogs)
        .values({
          employeeId: employee.id,
          logDate,
          status: "on_leave",
          checkInTime: "—",
          notes: `Approved ${requestRow.leaveType} leave (${requestRow.startDate} to ${requestRow.endDate})`,
        })
        .onConflictDoUpdate({
          target: [attendanceLogs.employeeId, attendanceLogs.logDate],
          set: {
            status: "on_leave",
            checkInTime: "—",
            notes: `Approved ${requestRow.leaveType} leave (${requestRow.startDate} to ${requestRow.endDate})`,
          },
        });
    }

    await tx.insert(activityLogs).values({
      actorName: input.reviewerName,
      action: "leave.approved",
      entityType: "leave_request",
      entityId: requestRow.id,
      summary: `Approved ${requestRow.daysRequested}-day ${requestRow.leaveType} leave for ${employee.fullName}. Deducted balance to ${newBalance}d and logged ${leaveDates.length} on_leave attendance record(s).`,
    });

    return {
      leaveRequestId: requestRow.id,
      employeeId: employee.id,
      status: "approved",
      daysRequested: requestRow.daysRequested,
      remainingBalanceDays: newBalance,
      attendanceDatesLogged: leaveDates,
    };
  });
}
