import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

// Run tests against isolated in-memory PGlite PostgreSQL so local ./data is never touched
process.env.PGLITE_DATA_DIR = "memory://";
process.env.DATABASE_URL = "";

import { getDb, resetDemoWorkspace } from "@/db";
import { activities, contacts, dealHistory, deals, leads } from "@/db/schema";
import { getAnalyticsData, getDashboardData } from "@/lib/analytics";
import { hashPassword, hashSessionToken, verifyPassword } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { contactCreateSchema, dealCreateSchema, leadCreateSchema } from "@/lib/validation";

describe("PipelineOS security & validation", () => {
  it("hashes passwords with per-user salt and verifies cleanly", () => {
    const h1 = hashPassword("PipelineDemo2026!");
    const h2 = hashPassword("PipelineDemo2026!");
    assert.notEqual(h1, h2, "unique salts produce distinct hashes");
    assert.equal(verifyPassword("PipelineDemo2026!", h1), true);
    assert.equal(verifyPassword("WrongPassword!", h1), false);
  });

  it("produces deterministic HMAC session token hashes", () => {
    const t = "sample-session-token-123";
    assert.equal(hashSessionToken(t), hashSessionToken(t));
    assert.notEqual(hashSessionToken(t), t);
  });

  it("validates contacts, leads and deals strictly with Zod", () => {
    assert.equal(contactCreateSchema.safeParse({ firstName: "Ali", lastName: "Khan", email: "bad-email" }).success, false);
    assert.equal(contactCreateSchema.safeParse({ firstName: "Ali", lastName: "Khan", email: "ali@example.com" }).success, true);
    assert.equal(leadCreateSchema.safeParse({ name: "Lead", email: "a@b.co", score: 150 }).success, false);
    assert.equal(dealCreateSchema.safeParse({ title: "Deal", value: -100 }).success, false);
  });

  it("enforces sliding-window rate limits", () => {
    const key = `test-limit-${Date.now()}`;
    assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
    assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
    const blocked = checkRateLimit(key, 2, 10_000);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds >= 1);
  });
});

describe("PipelineOS PostgreSQL end-to-end CRM workflows", () => {
  it("bootstraps schema, seeds demo fixtures, runs CRUD, updates analytics and resets cleanly", async () => {
    const db = await getDb();

    // 1. Seeded dashboard counts
    const initialDash = await getDashboardData();
    assert.equal(initialDash.kpis.totalContacts, 12);
    assert.ok(initialDash.kpis.activeOpportunities >= 5);
    assert.ok(initialDash.kpis.dealsWon >= 4);
    assert.ok(initialDash.kpis.pipelineValue > 100_000);

    // 2. Contact creation & editing
    const [createdContact] = await db
      .insert(contacts)
      .values({
        firstName: "Zara",
        lastName: "Malik",
        email: "zara@test-demo.example",
        companyName: "Aurora Freight",
        status: "prospect",
        category: "decision_maker",
        notes: "Initial discovery note",
      })
      .returning();
    assert.ok(createdContact.id);

    await db
      .update(contacts)
      .set({ status: "active", notes: "Updated after intro call" })
      .where(eq(contacts.id, createdContact.id));

    const [editedContact] = await db.select().from(contacts).where(eq(contacts.id, createdContact.id));
    assert.equal(editedContact.status, "active");
    assert.equal(editedContact.notes, "Updated after intro call");

    // 3. Lead creation & qualification
    const [createdLead] = await db
      .insert(leads)
      .values({
        name: "Samir Qureshi",
        email: "samir@aurora-demo.example",
        companyName: "Aurora Freight",
        source: "referral",
        status: "new",
        score: 60,
        estimatedValue: 30_000,
      })
      .returning();

    await db.update(leads).set({ status: "qualified", score: 85 }).where(eq(leads.id, createdLead.id));
    const [qualifiedLead] = await db.select().from(leads).where(eq(leads.id, createdLead.id));
    assert.equal(qualifiedLead.status, "qualified");

    // 4. Deal creation + stage movement to Won + audit history + live analytics update
    const beforeAnalytics = await getAnalyticsData();
    const [createdDeal] = await db
      .insert(deals)
      .values({
        title: "Aurora Freight Dispatch CRM",
        value: 30_000,
        stage: "proposal",
        probability: 60,
        contactId: createdContact.id,
        companyName: "Aurora Freight",
      })
      .returning();

    await db
      .update(deals)
      .set({ stage: "won", probability: 100, closedAt: new Date() })
      .where(eq(deals.id, createdDeal.id));

    await db.insert(dealHistory).values({
      dealId: createdDeal.id,
      fromStage: "proposal",
      toStage: "won",
      changedBy: "Test Runner",
      note: "Closed won in acceptance test",
    });

    const history = await db.select().from(dealHistory).where(eq(dealHistory.dealId, createdDeal.id));
    assert.equal(history.length, 1);
    assert.equal(history[0].toStage, "won");

    const afterAnalytics = await getAnalyticsData();
    assert.equal(afterAnalytics.summary.totalRevenueWon, beforeAnalytics.summary.totalRevenueWon + 30_000);

    // 5. Task creation
    const [task] = await db
      .insert(activities)
      .values({
        type: "call",
        title: "Kickoff call with Aurora Freight",
        status: "pending",
        contactId: createdContact.id,
        dealId: createdDeal.id,
      })
      .returning();
    assert.equal(task.status, "pending");

    // 6. Demo reset restores exact baseline counts
    await resetDemoWorkspace();
    const resetDash = await getDashboardData();
    assert.equal(resetDash.kpis.totalContacts, 12);
    assert.equal(resetDash.kpis.totalWonRevenue, initialDash.kpis.totalWonRevenue);
  });
});

