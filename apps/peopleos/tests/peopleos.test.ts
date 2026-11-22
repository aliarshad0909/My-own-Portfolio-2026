import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { and, desc, eq, inArray, lte } from "drizzle-orm";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";

// Force isolated in-memory PGlite for deterministic real-PostgreSQL tests
process.env.DATABASE_URL = "";
process.env.PEOPLEOS_DATABASE_URL = "";
process.env.PGLITE_DATA_DIR = "memory://";

import { getDb, resetDemoWorkspace } from "@/db";
import * as schema from "@/db/schema";
import {
  attendanceLogs,
  candidates,
  employees,
  leaveRequests,
  onboardingTasks,
} from "@/db/schema";
import { seedDemoData } from "@/db/seed";
import {
  computeCurrentAttendanceAnalytics,
  selectCurrentAttendanceDate,
  todayIsoDateUtc,
} from "@/lib/analytics";
import {
  generateLockedPassword,
  hashPassword,
  resolveSessionSecret,
  verifyPassword,
} from "@/lib/crypto";
import {
  LeaveReviewError,
  enumerateLeaveDates,
  reviewLeaveRequestTx,
  sanitizeEmployeeForViewer,
} from "@/lib/hr-service";
import {
  MAX_LEAVE_WINDOW_DAYS,
  calculateInclusiveLeaveDays,
  validateLeaveDateWindow,
} from "@/lib/leave-dates";
import { verifyCsrfOrigin } from "@/lib/security";
import { createLeaveRequestSchema } from "@/lib/validators";

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

function isoDateOffset(daysDelta: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysDelta);
  return d.toISOString().slice(0, 10);
}

describe("Regression: concurrent leave review locking & atomic balance updates", () => {
  it("accumulates both deductions accurately when two requests for the same employee are approved concurrently", async () => {
    const db = await getDb();
    await resetDemoWorkspace();

    const [priya] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "employee@peopleos.studio"))
      .limit(1);
    assert.ok(priya);
    const startingBalance = priya.leaveBalanceDays;

    const [reqA, reqB] = await db
      .insert(leaveRequests)
      .values([
        {
          employeeId: priya.id,
          leaveType: "annual",
          startDate: "2027-09-01",
          endDate: "2027-09-02",
          daysRequested: 2,
          reason: "Concurrent approval A",
          status: "pending",
        },
        {
          employeeId: priya.id,
          leaveType: "annual",
          startDate: "2027-09-10",
          endDate: "2027-09-12",
          daysRequested: 3,
          reason: "Concurrent approval B",
          status: "pending",
        },
      ])
      .returning();

    const outcomes = await Promise.allSettled([
      reviewLeaveRequestTx(db, {
        leaveRequestId: reqA.id,
        decision: "approved",
        reviewerName: "Marcus Vance",
      }),
      reviewLeaveRequestTx(db, {
        leaveRequestId: reqB.id,
        decision: "approved",
        reviewerName: "Hannah Reyes",
      }),
    ]);

    assert.equal(
      outcomes.filter((o) => o.status === "fulfilled").length,
      2,
      "Both approvals should succeed when combined days fit in balance",
    );

    const [updatedPriya] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, priya.id))
      .limit(1);
    assert.equal(
      updatedPriya.leaveBalanceDays,
      startingBalance - 5,
      "Both balance deductions (2 + 3 = 5) must accumulate without lost updates",
    );

    const logged = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.employeeId, priya.id),
          inArray(attendanceLogs.logDate, [
            "2027-09-01",
            "2027-09-02",
            "2027-09-10",
            "2027-09-11",
            "2027-09-12",
          ]),
        ),
      );
    assert.equal(logged.length, 5);
    assert.ok(logged.every((r) => r.status === "on_leave"));
  });

  it("allows only one concurrent approval when combined days exceed employee balance and fails the second with 409", async () => {
    const db = await getDb();
    await resetDemoWorkspace();

    const [liam] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "liam.chen@peopleos.studio"))
      .limit(1);
    assert.ok(liam);

    await db
      .update(employees)
      .set({ leaveBalanceDays: 5 })
      .where(eq(employees.id, liam.id));

    const [req1, req2] = await db
      .insert(leaveRequests)
      .values([
        {
          employeeId: liam.id,
          leaveType: "annual",
          startDate: "2027-10-01",
          endDate: "2027-10-04",
          daysRequested: 4,
          reason: "Over-budget concurrent request 1",
          status: "pending",
        },
        {
          employeeId: liam.id,
          leaveType: "annual",
          startDate: "2027-10-10",
          endDate: "2027-10-13",
          daysRequested: 4,
          reason: "Over-budget concurrent request 2",
          status: "pending",
        },
      ])
      .returning();

    const outcomes = await Promise.allSettled([
      reviewLeaveRequestTx(db, {
        leaveRequestId: req1.id,
        decision: "approved",
        reviewerName: "Marcus Vance",
      }),
      reviewLeaveRequestTx(db, {
        leaveRequestId: req2.id,
        decision: "approved",
        reviewerName: "Hannah Reyes",
      }),
    ]);

    const fulfilled = outcomes.filter((o) => o.status === "fulfilled");
    const rejected = outcomes.filter((o) => o.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(rejected[0].reason instanceof LeaveReviewError);
    assert.equal(rejected[0].reason.statusCode, 409);

    const [updatedLiam] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, liam.id))
      .limit(1);
    assert.equal(updatedLiam.leaveBalanceDays, 1);

    const [row1, row2] = await db
      .select()
      .from(leaveRequests)
      .where(inArray(leaveRequests.id, [req1.id, req2.id]));
    const statuses = [row1.status, row2.status].sort();
    assert.deepEqual(statuses, ["approved", "pending"]);

    const winnerId = fulfilled[0].value.leaveRequestId;
    const loserDates =
      winnerId === req1.id
        ? ["2027-10-10", "2027-10-11", "2027-10-12", "2027-10-13"]
        : ["2027-10-01", "2027-10-02", "2027-10-03", "2027-10-04"];
    const loserAttendance = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.employeeId, liam.id),
          inArray(attendanceLogs.logDate, loserDates),
        ),
      );
    assert.equal(loserAttendance.length, 0);
  });

  it("handles concurrent approve + reject on the same pending request with exactly one 409 loser and clean state", async () => {
    const db = await getDb();
    await resetDemoWorkspace();

    const [nadia] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "nadia.almansoor@peopleos.studio"))
      .limit(1);
    assert.ok(nadia);
    const initialBalance = nadia.leaveBalanceDays;

    // Race 1: reject vs approve (reject starts first so we specifically exercise reject-wins path)
    const [raceRejectFirst] = await db
      .insert(leaveRequests)
      .values({
        employeeId: nadia.id,
        leaveType: "annual",
        startDate: "2027-11-01",
        endDate: "2027-11-03",
        daysRequested: 3,
        reason: "Concurrent reject vs approve race",
        status: "pending",
      })
      .returning();

    const race1 = await Promise.allSettled([
      reviewLeaveRequestTx(db, {
        leaveRequestId: raceRejectFirst.id,
        decision: "rejected",
        reviewerName: "Marcus Vance",
      }),
      reviewLeaveRequestTx(db, {
        leaveRequestId: raceRejectFirst.id,
        decision: "approved",
        reviewerName: "Hannah Reyes",
      }),
    ]);

    const race1Fulfilled = race1.filter((r) => r.status === "fulfilled");
    const race1Rejected = race1.filter((r) => r.status === "rejected");
    assert.equal(race1Fulfilled.length, 1);
    assert.equal(race1Rejected.length, 1);
    assert.ok(race1Rejected[0].reason instanceof LeaveReviewError);
    assert.equal(race1Rejected[0].reason.statusCode, 409);

    const [afterRace1Req] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, raceRejectFirst.id))
      .limit(1);
    const [afterRace1Emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, nadia.id))
      .limit(1);
    const race1Att = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.employeeId, nadia.id),
          inArray(attendanceLogs.logDate, ["2027-11-01", "2027-11-02", "2027-11-03"]),
        ),
      );

    assert.equal(afterRace1Req.status, race1Fulfilled[0].value.status);
    if (afterRace1Req.status === "rejected") {
      assert.equal(afterRace1Emp.leaveBalanceDays, initialBalance);
      assert.equal(race1Att.length, 0);
    } else {
      assert.equal(afterRace1Emp.leaveBalanceDays, initialBalance - 3);
      assert.equal(race1Att.length, 3);
    }

    // Race 2: approve vs reject
    const balanceBeforeRace2 = afterRace1Emp.leaveBalanceDays;
    const [raceApproveFirst] = await db
      .insert(leaveRequests)
      .values({
        employeeId: nadia.id,
        leaveType: "annual",
        startDate: "2027-11-10",
        endDate: "2027-11-11",
        daysRequested: 2,
        reason: "Concurrent approve vs reject race",
        status: "pending",
      })
      .returning();

    const race2 = await Promise.allSettled([
      reviewLeaveRequestTx(db, {
        leaveRequestId: raceApproveFirst.id,
        decision: "approved",
        reviewerName: "Hannah Reyes",
      }),
      reviewLeaveRequestTx(db, {
        leaveRequestId: raceApproveFirst.id,
        decision: "rejected",
        reviewerName: "Marcus Vance",
      }),
    ]);

    const race2Fulfilled = race2.filter((r) => r.status === "fulfilled");
    const race2Rejected = race2.filter((r) => r.status === "rejected");
    assert.equal(race2Fulfilled.length, 1);
    assert.equal(race2Rejected.length, 1);
    assert.ok(race2Rejected[0].reason instanceof LeaveReviewError);
    assert.equal(race2Rejected[0].reason.statusCode, 409);

    const [afterRace2Req] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, raceApproveFirst.id))
      .limit(1);
    const [afterRace2Emp] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, nadia.id))
      .limit(1);
    const race2Att = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.employeeId, nadia.id),
          inArray(attendanceLogs.logDate, ["2027-11-10", "2027-11-11"]),
        ),
      );

    assert.equal(afterRace2Req.status, race2Fulfilled[0].value.status);
    if (afterRace2Req.status === "rejected") {
      assert.equal(afterRace2Emp.leaveBalanceDays, balanceBeforeRace2);
      assert.equal(race2Att.length, 0);
    } else {
      assert.equal(afterRace2Emp.leaveBalanceDays, balanceBeforeRace2 - 2);
      assert.equal(race2Att.length, 2);
    }
  });

  it("issues PostgreSQL FOR UPDATE row locks in consistent order and atomic conditional UPDATEs", async () => {
    const queries: string[] = [];
    const client = new PGlite();
    const loggedDb = drizzlePglite(client, {
      schema,
      logger: {
        logQuery(query: string) {
          queries.push(query);
        },
      },
    });

    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), "src", "db", "migrations", "0000_init.sql"),
      "utf8",
    );
    await client.exec(migrationSql);
    await seedDemoData(loggedDb);

    const [pendingReq] = await loggedDb
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.status, "pending"))
      .limit(1);
    assert.ok(pendingReq);

    queries.length = 0;
    await reviewLeaveRequestTx(loggedDb, {
      leaveRequestId: pendingReq.id,
      decision: "approved",
      reviewerName: "Hannah Reyes",
    });

    const lockLeaveIdx = queries.findIndex(
      (q) => /from "leave_requests"/i.test(q) && /for update/i.test(q),
    );
    const lockEmpIdx = queries.findIndex(
      (q) => /from "employees"/i.test(q) && /for update/i.test(q),
    );
    const condLeaveUpdate = queries.find(
      (q) => /update "leave_requests"/i.test(q) && /"leave_requests"\."status"\s*=\s*\$/i.test(q),
    );
    const atomicBalanceUpdate = queries.find(
      (q) =>
        /update "employees"/i.test(q) &&
        /"leave_balance_days"\s*=\s*"employees"\."leave_balance_days"\s*-/i.test(q) &&
        /"employees"\."leave_balance_days"\s*>=\s*\$/i.test(q),
    );

    assert.ok(lockLeaveIdx >= 0, "Expected SELECT ... FROM leave_requests ... FOR UPDATE");
    assert.ok(lockEmpIdx > lockLeaveIdx, "Expected employees FOR UPDATE after leave_requests FOR UPDATE");
    assert.ok(condLeaveUpdate, "Expected atomic conditional UPDATE on leave_requests WHERE status = 'pending'");
    assert.ok(atomicBalanceUpdate, "Expected atomic relative balance deduction on employees WHERE leave_balance_days >= days");
    await client.close();
  });
});

describe("Regression: oversized leave windows & date-range validation", () => {
  const sampleEmployeeId = "11111111-1111-4111-8111-111111111111";

  it("computes true inclusive calendar day counts without clamping to 30", () => {
    assert.equal(calculateInclusiveLeaveDays("2026-06-10", "2026-06-12"), 3);
    assert.equal(calculateInclusiveLeaveDays("2026-06-01", "2026-06-30"), 30);
    assert.equal(calculateInclusiveLeaveDays("2026-06-01", "2026-07-05"), 35);
    assert.equal(calculateInclusiveLeaveDays("2026-06-01", "2026-07-15"), 45);
    assert.equal(calculateInclusiveLeaveDays("2026-06-10", "2026-06-08"), -1);
    assert.equal(calculateInclusiveLeaveDays("2026-02-31", "2026-03-02"), null);
  });

  it("rejects 35-day and 45-day leave requests instead of truncating to 30 days", () => {
    const thirtyFiveClampedPayload = createLeaveRequestSchema.safeParse({
      employeeId: sampleEmployeeId,
      leaveType: "annual",
      startDate: "2026-06-01",
      endDate: "2026-07-05",
      daysRequested: 30,
      reason: "Extended summer trip",
    });
    assert.equal(thirtyFiveClampedPayload.success, false);
    assert.match(thirtyFiveClampedPayload.error.issues[0]?.message ?? "", /cannot exceed 30 calendar days/i);

    const fortyFiveDayPayload = createLeaveRequestSchema.safeParse({
      employeeId: sampleEmployeeId,
      leaveType: "annual",
      startDate: "2026-06-01",
      endDate: "2026-07-15",
      daysRequested: 45,
      reason: "Sabbatical request",
    });
    assert.equal(fortyFiveDayPayload.success, false);
    assert.match(fortyFiveDayPayload.error.issues[0]?.message ?? "", /cannot exceed 30 calendar days/i);

    assert.throws(
      () => enumerateLeaveDates("2026-06-01", "2026-07-05"),
      (err: unknown) => err instanceof LeaveReviewError && err.statusCode === 400,
    );
  });

  it("rejects reversed date ranges and mismatched daysRequested values, while accepting valid 3-day windows", () => {
    const reversed = createLeaveRequestSchema.safeParse({
      employeeId: sampleEmployeeId,
      leaveType: "annual",
      startDate: "2026-06-12",
      endDate: "2026-06-10",
      daysRequested: 1,
      reason: "Reversed dates",
    });
    assert.equal(reversed.success, false);
    assert.match(reversed.error.issues[0]?.message ?? "", /on or after/i);

    const mismatched = createLeaveRequestSchema.safeParse({
      employeeId: sampleEmployeeId,
      leaveType: "annual",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      daysRequested: 5,
      reason: "Mismatched duration",
    });
    assert.equal(mismatched.success, false);
    assert.match(mismatched.error.issues[0]?.message ?? "", /must match the inclusive date range/i);

    const validExplicit = createLeaveRequestSchema.safeParse({
      employeeId: sampleEmployeeId,
      leaveType: "annual",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      daysRequested: 3,
      reason: "Valid 3-day vacation",
    });
    assert.equal(validExplicit.success, true);
    assert.equal(validExplicit.data.daysRequested, 3);

    const validDerived = createLeaveRequestSchema.safeParse({
      employeeId: sampleEmployeeId,
      leaveType: "annual",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      reason: "Valid 3-day vacation with server-derived days",
    });
    assert.equal(validDerived.success, true);
    assert.equal(validDerived.data.daysRequested, 3);

    const windowCheck = validateLeaveDateWindow("2026-06-01", "2026-07-05");
    assert.equal(windowCheck.ok, false);
    if (!windowCheck.ok) {
      assert.equal(windowCheck.days, 35);
      assert.equal(MAX_LEAVE_WINDOW_DAYS, 30);
    }
  });
});

describe("Regression: exclude future leave entries from current attendance analytics", () => {
  it("selects the latest date <= referenceDate and ignores future-dated on_leave entries", () => {
    const logs = [
      { logDate: "2026-05-01", status: "present" },
      { logDate: "2026-05-01", status: "present" },
      { logDate: "2026-05-01", status: "present" },
      { logDate: "2026-05-01", status: "present" },
      { logDate: "2026-05-01", status: "remote" },
      { logDate: "2026-05-01", status: "remote" },
      { logDate: "2026-05-01", status: "remote" },
      { logDate: "2026-05-01", status: "remote" },
      { logDate: "2026-05-01", status: "on_leave" },
      { logDate: "2026-05-01", status: "absent" },
      // Future approved leave rows that MUST NOT replace 2026-05-01
      { logDate: "2026-05-15", status: "on_leave" },
      { logDate: "2026-05-16", status: "on_leave" },
    ];

    assert.equal(selectCurrentAttendanceDate(logs, "2026-05-01"), "2026-05-01");
    const analytics = computeCurrentAttendanceAnalytics(logs, "2026-05-01");
    assert.equal(analytics.latestAttendanceDate, "2026-05-01");
    assert.equal(analytics.attendanceRatePct, 80);
    assert.equal(analytics.remoteSharePct, 50);
    assert.equal(analytics.totalAttendanceSamples, 10);

    // Only future entries -> no current attendance sample
    const futureOnly = computeCurrentAttendanceAnalytics(
      [{ logDate: "2026-05-15", status: "on_leave" }],
      "2026-05-01",
    );
    assert.equal(futureOnly.latestAttendanceDate, null);
    assert.equal(futureOnly.attendanceRatePct, 0);
    assert.equal(futureOnly.remoteSharePct, 0);
  });

  it("preserves today's attendance rate and remote share after approving a future-dated leave request (today+14..today+17)", async () => {
    const db = await getDb();
    await resetDemoWorkspace();

    const today = todayIsoDateUtc();
    const beforeRows = await db
      .select()
      .from(attendanceLogs)
      .where(lte(attendanceLogs.logDate, today))
      .orderBy(desc(attendanceLogs.logDate));
    const beforeAnalytics = computeCurrentAttendanceAnalytics(beforeRows, today);

    assert.equal(beforeAnalytics.latestAttendanceDate, today);
    assert.equal(beforeAnalytics.attendanceRatePct, 92);
    assert.equal(beforeAnalytics.remoteSharePct, 45);
    assert.equal(beforeAnalytics.totalAttendanceSamples, 12);

    const [nadia] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, "nadia.almansoor@peopleos.studio"))
      .limit(1);
    assert.ok(nadia);

    // Create and approve a future-dated leave request: today + 14 through today + 17 (4 days)
    const futureStart = isoDateOffset(14);
    const futureEnd = isoDateOffset(17);
    const [futureLeave] = await db
      .insert(leaveRequests)
      .values({
        employeeId: nadia.id,
        leaveType: "annual",
        startDate: futureStart,
        endDate: futureEnd,
        daysRequested: 4,
        reason: "Future leave should not alter today's attendance metrics",
        status: "pending",
      })
      .returning();

    const approval = await reviewLeaveRequestTx(db, {
      leaveRequestId: futureLeave.id,
      decision: "approved",
      reviewerName: "Marcus Vance",
    });
    assert.equal(approval.attendanceDatesLogged.length, 4);

    // Verify future on_leave rows actually exist in attendance_logs
    const allRowsAfter = await db
      .select()
      .from(attendanceLogs)
      .orderBy(desc(attendanceLogs.logDate));
    assert.ok(
      allRowsAfter.some((r) => r.logDate === futureEnd && r.status === "on_leave"),
      "Future on_leave attendance rows should be stored in attendance_logs",
    );

    // Both unfiltered helper input and dashboard's lte(logDate, today) query MUST preserve today's exact metrics
    const afterFromAll = computeCurrentAttendanceAnalytics(allRowsAfter, today);
    assert.equal(afterFromAll.latestAttendanceDate, today);
    assert.equal(afterFromAll.attendanceRatePct, beforeAnalytics.attendanceRatePct);
    assert.equal(afterFromAll.remoteSharePct, beforeAnalytics.remoteSharePct);
    assert.equal(afterFromAll.totalAttendanceSamples, beforeAnalytics.totalAttendanceSamples);

    const dashboardFilteredRows = await db
      .select()
      .from(attendanceLogs)
      .where(lte(attendanceLogs.logDate, today))
      .orderBy(desc(attendanceLogs.logDate));
    const afterDashboard = computeCurrentAttendanceAnalytics(dashboardFilteredRows, today);
    assert.equal(afterDashboard.latestAttendanceDate, today);
    assert.equal(afterDashboard.attendanceRatePct, 92);
    assert.equal(afterDashboard.remoteSharePct, 45);
    assert.equal(afterDashboard.totalAttendanceSamples, 12);

    await resetDemoWorkspace();
  });
});
