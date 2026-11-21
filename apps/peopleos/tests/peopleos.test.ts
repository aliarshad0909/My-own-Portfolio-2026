import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { and, eq } from "drizzle-orm";

// Force isolated in-memory PGlite for deterministic real-PostgreSQL tests
process.env.DATABASE_URL = "";
process.env.PEOPLEOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { getDb, resetDemoWorkspace } from "@/db";
import {
  attendanceLogs,
  candidates,
  employees,
  leaveRequests,
  onboardingTasks,
} from "@/db/schema";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import {
  LeaveReviewError,
  reviewLeaveRequestTx,
  sanitizeEmployeeForViewer,
} from "@/lib/hr-service";
import { verifyCsrfOrigin } from "@/lib/security";

describe("PeopleOS security & crypto primitives", () => {
  it("hashes and verifies scrypt passwords and generates high-entropy locked passwords", () => {
    const hash = hashPassword("PeopleDemo2026!");
    assert.equal(verifyPassword("PeopleDemo2026!", hash), true);
    assert.equal(verifyPassword("WrongPassword!", hash), false);

    const locked1 = generateLockedPassword();
    const locked2 = generateLockedPassword();
    assert.equal(locked1.length, 64);
    assert.notEqual(locked1, locked2);
  });

  it("enforces >=32-char SESSION_SECRET in production with external DB", () => {
    const prevRender = process.env.RENDER;
    const prevSecret = process.env.SESSION_SECRET;
    try {
      process.env.RENDER = "true";
      process.env.SESSION_SECRET = "short-secret";
      assert.throws(() => resolveSessionSecret(), /at least 32 random characters/);

      process.env.SESSION_SECRET = "a".repeat(40);
      assert.equal(resolveSessionSecret(), "a".repeat(40));
    } finally {
      if (prevRender === undefined) delete process.env.RENDER;
      else process.env.RENDER = prevRender;
      if (prevSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = prevSecret;
    }
  });

  it("blocks cross-origin mutations in verifyCsrfOrigin", () => {
    const badReq = new Request("http://localhost:3100/api/leave", {
      method: "POST",
      headers: {
        host: "localhost:3100",
        origin: "https://evil.example.com",
      },
    });
    const blocked = verifyCsrfOrigin(badReq);
    assert.ok(blocked);
    assert.equal(blocked.status, 403);

    const goodReq = new Request("http://localhost:3100/api/leave", {
      method: "POST",
      headers: {
        host: "localhost:3100",
        origin: "http://localhost:3100",
      },
    });
    assert.equal(verifyCsrfOrigin(goodReq), null);
  });
});

describe("PeopleOS RBAC PII redaction", () => {
  it("redacts private fields when employee role views another employee, but preserves self & admin views", () => {
    const samplePeer = {
      id: "emp-peer",
      employeeCode: "EMP-1007",
      fullName: "Liam Gallagher-Chen",
      email: "liam.chen@peopleos.studio",
      title: "Staff Backend Engineer",
      departmentId: "dept-eng",
      managerId: "emp-mgr",
      employmentType: "full_time",
      status: "active",
      startDate: "2024-02-05",
      location: "Seattle, WA",
      leaveBalanceDays: 14,
      compensationBandPrivate: "Band L5 · $154,000 – $168,000",
      emergencyContactPrivate: "Mei Chen · +1 (206) 555-0185",
      hrNotesPrivate: "Confidential HR review note",
    };

    // Standard employee viewing someone else -> REDACTED
    const asOtherEmployee = sanitizeEmployeeForViewer(samplePeer, {
      role: "employee",
      viewerEmployeeId: "emp-self",
    });
    assert.equal(asOtherEmployee.privateFieldsRedacted, true);
    assert.equal(asOtherEmployee.compensationBandPrivate, null);
    assert.equal(asOtherEmployee.emergencyContactPrivate, null);
    assert.equal(asOtherEmployee.hrNotesPrivate, null);

    // Standard employee viewing own profile -> VISIBLE
    const asSelf = sanitizeEmployeeForViewer(samplePeer, {
      role: "employee",
      viewerEmployeeId: "emp-peer",
    });
    assert.equal(asSelf.privateFieldsRedacted, false);
    assert.equal(asSelf.compensationBandPrivate, samplePeer.compensationBandPrivate);

    // Manager viewing non-direct-report -> REDACTED; direct report -> VISIBLE
    const asNonManager = sanitizeEmployeeForViewer(samplePeer, {
      role: "manager",
      viewerEmployeeId: "emp-other-mgr",
      directReportIds: new Set(["emp-someone-else"]),
    });
    assert.equal(asNonManager.privateFieldsRedacted, true);

    const asDirectManager = sanitizeEmployeeForViewer(samplePeer, {
      role: "manager",
      viewerEmployeeId: "emp-mgr",
      directReportIds: new Set(["emp-peer"]),
    });
    assert.equal(asDirectManager.privateFieldsRedacted, false);

    // Admin / Demo -> ALWAYS VISIBLE
    const asAdmin = sanitizeEmployeeForViewer(samplePeer, {
      role: "admin",
      viewerEmployeeId: "emp-admin",
    });
    assert.equal(asAdmin.privateFieldsRedacted, false);
    assert.equal(asAdmin.hrNotesPrivate, samplePeer.hrNotesPrivate);
  });
});

describe("PeopleOS PostgreSQL end-to-end HR workflows", () => {
  it("runs atomic leave approval (balance deduction + on_leave attendance), rejection, insufficient-balance guard, candidate stage advance, onboarding toggle, and demo reset", async () => {
    const db = await getDb();

    // 1. Find seeded employee Priya Nair
    const [priya] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "employee@peopleos.studio"))
      .limit(1);
    assert.ok(priya, "Seeded employee Priya Nair should exist");
    const initialBalance = priya.leaveBalanceDays;

    // 2. Submit a new 2-day annual leave request
    const [createdLeave] = await db
      .insert(leaveRequests)
      .values({
        employeeId: priya.id,
        leaveType: "annual",
        startDate: "2027-06-10",
        endDate: "2027-06-11",
        daysRequested: 2,
        reason: "Unit test atomic approval flow",
        status: "pending",
      })
      .returning();

    // 3. Approve atomically inside ONE transaction
    const approvalResult = await reviewLeaveRequestTx(db, {
      leaveRequestId: createdLeave.id,
      decision: "approved",
      reviewerName: "Marcus Vance (Eng Manager)",
    });

    assert.equal(approvalResult.status, "approved");
    assert.equal(approvalResult.remainingBalanceDays, initialBalance - 2);
    assert.deepEqual(approvalResult.attendanceDatesLogged, ["2027-06-10", "2027-06-11"]);

    // Verify PostgreSQL state updated consistently
    const [updatedPriya] = await db.select().from(employees).where(eq(employees.id, priya.id)).limit(1);
    assert.equal(updatedPriya.leaveBalanceDays, initialBalance - 2);

    const [updatedLeave] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, createdLeave.id))
      .limit(1);
    assert.equal(updatedLeave.status, "approved");
    assert.equal(updatedLeave.reviewedBy, "Marcus Vance (Eng Manager)");

    const loggedAttendance = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.employeeId, priya.id), eq(attendanceLogs.logDate, "2027-06-10")));
    assert.equal(loggedAttendance.length, 1);
    assert.equal(loggedAttendance[0].status, "on_leave");

    // 4. Rejecting a leave request leaves leave_balance_days untouched
    const [toReject] = await db
      .insert(leaveRequests)
      .values({
        employeeId: priya.id,
        leaveType: "annual",
        startDate: "2027-07-01",
        endDate: "2027-07-03",
        daysRequested: 3,
        reason: "Overlaps launch sprint",
        status: "pending",
      })
      .returning();

    const rejectResult = await reviewLeaveRequestTx(db, {
      leaveRequestId: toReject.id,
      decision: "rejected",
      reviewerName: "Hannah Reyes",
    });
    assert.equal(rejectResult.status, "rejected");
    assert.equal(rejectResult.remainingBalanceDays, initialBalance - 2);

    const [afterRejectPriya] = await db.select().from(employees).where(eq(employees.id, priya.id)).limit(1);
    assert.equal(afterRejectPriya.leaveBalanceDays, initialBalance - 2);

    // 5. Insufficient balance is rejected atomically (409) without altering balance or attendance
    const [overLimit] = await db
      .insert(leaveRequests)
      .values({
        employeeId: priya.id,
        leaveType: "annual",
        startDate: "2027-08-01",
        endDate: "2027-08-25",
        daysRequested: 25,
        reason: "Exceeds remaining balance",
        status: "pending",
      })
      .returning();

    await assert.rejects(
      () =>
        reviewLeaveRequestTx(db, {
          leaveRequestId: overLimit.id,
          decision: "approved",
          reviewerName: "Hannah Reyes",
        }),
      (err: unknown) => err instanceof LeaveReviewError && err.statusCode === 409,
    );

    const [stillPending] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, overLimit.id))
      .limit(1);
    assert.equal(stillPending.status, "pending");

    // 6. Candidate stage advance
    const [cand] = await db.select().from(candidates).where(eq(candidates.stage, "applied")).limit(1);
    assert.ok(cand, "Seeded candidate in applied stage should exist");
    const [advancedCand] = await db
      .update(candidates)
      .set({ stage: "screening" })
      .where(eq(candidates.id, cand.id))
      .returning();
    assert.equal(advancedCand.stage, "screening");

    // 7. Onboarding task toggle
    const [task] = await db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.completed, false))
      .limit(1);
    assert.ok(task, "Seeded incomplete onboarding task should exist");
    const [toggledTask] = await db
      .update(onboardingTasks)
      .set({ completed: true })
      .where(eq(onboardingTasks.id, task.id))
      .returning();
    assert.equal(toggledTask.completed, true);

    // 8. Demo reset restores original leave balance & seeded records
    await resetDemoWorkspace();
    const [restoredPriya] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "employee@peopleos.studio"))
      .limit(1);
    assert.equal(restoredPriya.leaveBalanceDays, initialBalance);
  });
});
