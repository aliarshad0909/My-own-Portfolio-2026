import { and, eq, gte, sql } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { activityLogs, attendanceLogs, employees, leaveRequests } from "@/db/schema";
import {
  computeCurrentAttendanceAnalytics,
  selectCurrentAttendanceDate,
  todayIsoDateUtc,
} from "@/lib/analytics";
import {
  MAX_LEAVE_WINDOW_DAYS,
  calculateInclusiveLeaveDays,
  validateLeaveDateWindow,
} from "@/lib/leave-dates";

export {
  MAX_LEAVE_WINDOW_DAYS,
  calculateInclusiveLeaveDays,
  computeCurrentAttendanceAnalytics,
  selectCurrentAttendanceDate,
  todayIsoDateUtc,
  validateLeaveDateWindow,
};

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
 * Rejects invalid, reversed, or oversized (> maxDays) leave windows instead of truncating.
 */
export function enumerateLeaveDates(
  startDate: string,
  endDate: string,
  maxDays: number = MAX_LEAVE_WINDOW_DAYS,
): string[] {
  const validation = validateLeaveDateWindow(startDate, endDate, undefined, maxDays);
  if (!validation.ok) {
    throw new LeaveReviewError(validation.error, 400);
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const dates: string[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < validation.days; i += 1) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
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
 * Locks leave_requests then employees (consistent order to prevent deadlocks) via FOR UPDATE
 * before checking pending status or balance, and uses conditional/relative atomic UPDATEs.
 * On approval:
 *   1. Locks leave_requests & employees rows, validates status='pending', date window, and balance.
 *   2. Conditionally updates leave_requests.status = 'approved' WHERE status = 'pending'.
 *   3. Atomically deducts days_requested via leave_balance_days = leave_balance_days - days WHERE >= days.
 *   4. Upserts 'on_leave' entries in attendance_logs for every date in the leave window.
 *   5. Records an audit entry in activity_logs.
 * On rejection:
 *   1. Conditionally updates leave_requests.status = 'rejected' WHERE status = 'pending' without altering balance or attendance_logs.
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
    // 1. Lock the leave_requests row first
    const [requestRow] = await tx
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, input.leaveRequestId))
      .for("update")
      .limit(1);

    if (!requestRow) {
      throw new LeaveReviewError("Leave request not found.", 404);
    }

    // 2. Lock the associated employees row in consistent order (leave_requests -> employees)
    // BEFORE checking pending status or leave balance to prevent race conditions and deadlocks.
    const [employee] = await tx
      .select()
      .from(employees)
      .where(eq(employees.id, requestRow.employeeId))
      .for("update")
      .limit(1);

    if (!employee) {
      throw new LeaveReviewError("Associated employee record not found.", 404);
    }

    // 3. Re-verify pending status under lock
    if (requestRow.status !== "pending") {
      throw new LeaveReviewError(
        `Leave request has already been ${requestRow.status}.`,
        409,
      );
    }

    const now = new Date();

    if (input.decision === "rejected") {
      const [updatedRequest] = await tx
        .update(leaveRequests)
        .set({
          status: "rejected",
          reviewedBy: input.reviewerName,
          reviewedAt: now,
        })
        .where(and(eq(leaveRequests.id, requestRow.id), eq(leaveRequests.status, "pending")))
        .returning();

      if (!updatedRequest) {
        throw new LeaveReviewError("Leave request has already been reviewed.", 409);
      }

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

    // Approval path: validate leave date window & daysRequested consistency (never silently truncate)
    const windowValidation = validateLeaveDateWindow(
      requestRow.startDate,
      requestRow.endDate,
      requestRow.daysRequested,
    );
    if (!windowValidation.ok) {
      throw new LeaveReviewError(windowValidation.error, 400);
    }

    // Validate sufficient balance under lock before updating
    if (employee.leaveBalanceDays < requestRow.daysRequested) {
      throw new LeaveReviewError(
        `Insufficient leave balance: ${employee.fullName} has ${employee.leaveBalanceDays} day(s) remaining, but requested ${requestRow.daysRequested} day(s).`,
        409,
      );
    }

    const leaveDates = enumerateLeaveDates(requestRow.startDate, requestRow.endDate);

    // Atomic conditional transition on leave_requests
    const [updatedRequest] = await tx
      .update(leaveRequests)
      .set({
        status: "approved",
        reviewedBy: input.reviewerName,
        reviewedAt: now,
      })
      .where(and(eq(leaveRequests.id, requestRow.id), eq(leaveRequests.status, "pending")))
      .returning();

    if (!updatedRequest) {
      throw new LeaveReviewError("Leave request has already been reviewed.", 409);
    }

    // Atomic relative balance deduction on employees
    const [updatedEmployee] = await tx
      .update(employees)
      .set({
        leaveBalanceDays: sql`${employees.leaveBalanceDays} - ${requestRow.daysRequested}`,
      })
      .where(
        and(
          eq(employees.id, employee.id),
          gte(employees.leaveBalanceDays, requestRow.daysRequested),
        ),
      )
      .returning();

    if (!updatedEmployee) {
      throw new LeaveReviewError(
        `Insufficient leave balance: ${employee.fullName} has fewer than ${requestRow.daysRequested} day(s) remaining.`,
        409,
      );
    }

    const newBalance = updatedEmployee.leaveBalanceDays;

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
