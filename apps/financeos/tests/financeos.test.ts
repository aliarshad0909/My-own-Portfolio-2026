import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { eq } from "drizzle-orm";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.DATABASE_URL = "";
process.env.FINANCEOS_DATABASE_URL = "";

import { getDb, resetDemoWorkspace } from "@/db";
import { accounts, bankStatements, budgets, invoices, transactions } from "@/db/schema";
import {
  AccountingError,
  allocateInvoiceNumber,
  createInvoiceWithItems,
  getFinancialOverview,
  listEnrichedInvoices,
  parseBankStatementCsv,
  reconcileBankStatement,
  toBaseUsdCents,
  updateInvoiceStatus,
} from "@/lib/accounting";
import { generateLockedPassword, hashPassword, resolveSessionSecret, verifyPassword } from "@/lib/crypto";
import { verifyCsrfOrigin } from "@/lib/security";
import { reconcileSchema } from "@/lib/validation";

describe("FinanceOS security, FX math & CSV parsing", () => {
  it("hashes credentials, enforces production SESSION_SECRET, and validates CSRF origin", () => {
    const h = hashPassword("FinanceDemo2026!");
    assert.equal(verifyPassword("FinanceDemo2026!", h), true);
    assert.equal(verifyPassword("wrong", h), false);
    assert.equal(generateLockedPassword().length, 64);

    const prevRender = process.env.RENDER;
    const prevSecret = process.env.SESSION_SECRET;
    try {
      process.env.RENDER = "true";
      process.env.SESSION_SECRET = "short";
      assert.throws(() => resolveSessionSecret(), />= 32/);
    } finally {
      if (prevRender === undefined) delete process.env.RENDER;
      else process.env.RENDER = prevRender;
      if (prevSecret === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = prevSecret;
    }

    const bad = new Request("https://finance.aliarshad.co/api/demo/reset", {
      method: "POST",
      headers: { host: "finance.aliarshad.co", origin: "https://evil.example" },
    });
    assert.equal(verifyCsrfOrigin(bad)?.status, 403);
  });

  it("converts multi-currency cents cleanly and parses RFC-4180 quoted CSV bank statements", () => {
    assert.equal(toBaseUsdCents(100000, 1.08), 108000);
    const rows = parseBankStatementCsv(
      [
        "date,description,amount,currency,reference",
        "2026-11-20,WIRE IN,1250.50,USD,REF-1",
        "2026-11-21,CLOUD BILL,-300.25,USD,REF-2",
        '2026-11-22,"ACME, Inc","1,250.50",USD,REF-3',
        '2026-11-23,"ACME ""Global"", LLC","-1,250.50",EUR,"REF, 4"',
        '2026-11-24,"Widget Corp","($3,400.75)",USD,REF-5',
      ].join("\r\n"),
    );
    assert.equal(rows.length, 5);
    assert.equal(rows[0].amountCents, 125050);
    assert.equal(rows[1].amountCents, -30025);
    assert.deepEqual(rows[2], {
      statementDate: "2026-11-22",
      description: "ACME, Inc",
      amountCents: 125050,
      currency: "USD",
      reference: "REF-3",
    });
    assert.deepEqual(rows[3], {
      statementDate: "2026-11-23",
      description: 'ACME "Global", LLC',
      amountCents: -125050,
      currency: "EUR",
      reference: "REF, 4",
    });
    assert.deepEqual(rows[4], {
      statementDate: "2026-11-24",
      description: "Widget Corp",
      amountCents: -340075,
      currency: "USD",
      reference: "REF-5",
    });
  });

  it("validates reconciliation exchangeRate inputs cleanly", () => {
    const validUuid = "11111111-1111-4111-8111-111111111111";
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid }).success, true);
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid, exchangeRate: 1.1 }).success, true);
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid, exchangeRate: "1.10" }).success, true);
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid, exchangeRate: 0 }).success, false);
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid, exchangeRate: -1.5 }).success, false);
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid, exchangeRate: "" }).success, false);
    assert.equal(reconcileSchema.safeParse({ statementId: validUuid, exchangeRate: null }).success, false);
  });
});

describe("FinanceOS PostgreSQL ERP workflows & Codex regression suite", () => {
  it("computes P&L/Cash-Flow from DB, settles AR invoice atomically into ledger, imports CSV, and resets", async () => {
    await resetDemoWorkspace();
    const db = await getDb();
    const initial = await getFinancialOverview();
    assert.ok(initial.kpis.totalRevenueCents > 0);
    assert.ok(initial.kpis.openReceivablesCents > 0);
    assert.ok(initial.kpis.openPayablesCents > 0);

    // 1. Mark an open AR invoice paid -> should increase totalRevenueCents and reduce openReceivablesCents
    const allInv = await listEnrichedInvoices();
    const openAr = allInv.find((i) => i.direction === "receivable" && i.status !== "paid");
    assert.ok(openAr, "Expected at least one open AR invoice in demo seed");

    await updateInvoiceStatus(openAr.id, "mark_paid", "QA CFO");
    const afterPaid = await getFinancialOverview();
    assert.equal(
      afterPaid.kpis.totalRevenueCents,
      initial.kpis.totalRevenueCents + openAr.baseTotalCents,
    );
    assert.equal(
      afterPaid.kpis.openReceivablesCents,
      initial.kpis.openReceivablesCents - openAr.baseTotalCents,
    );

    // 2. Insert a multi-currency expense and verify net profit decreases
    await db.insert(transactions).values({
      type: "expense",
      category: "Marketing & Growth",
      description: "QA Campaign EUR 1000",
      currency: "EUR",
      exchangeRate: 1.08,
      amountCents: 100000,
      baseAmountCents: 108000,
      occurredAt: "2026-11-21",
      createdBy: "QA CFO",
    });
    const afterExpense = await getFinancialOverview();
    assert.equal(afterExpense.kpis.netProfitCents, afterPaid.kpis.netProfitCents - 108000);

    // 3. Insert CSV bank statement line
    const [st] = await db
      .insert(bankStatements)
      .values({
        statementDate: "2026-11-21",
        description: "QA BANK ENTRY",
        currency: "USD",
        amountCents: 50000,
        status: "unmatched",
      })
      .returning();
    assert.equal(st.status, "unmatched");

    // 4. Reset demo workspace restores exact baseline
    await resetDemoWorkspace();
    const afterReset = await getFinancialOverview();
    assert.equal(afterReset.kpis.totalRevenueCents, initial.kpis.totalRevenueCents);
    assert.equal(afterReset.kpis.openReceivablesCents, initial.kpis.openReceivablesCents);

    const invCount = (await db.select().from(invoices)).length;
    assert.equal(invCount, 5);
  });

  it("Regression #1: serializes concurrent invoice mark_paid so only 1 settlement ledger entry is posted", async () => {
    await resetDemoWorkspace();
    const db = await getDb();
    const beforeOverview = await getFinancialOverview();
    const allInv = await listEnrichedInvoices();
    const openAr = allInv.find((i) => i.direction === "receivable" && i.status !== "paid");
    assert.ok(openAr, "Expected an open AR invoice");

    // Fire concurrent mark_paid requests against the exact same invoice
    const results = await Promise.all([
      updateInvoiceStatus(openAr.id, "mark_paid", "Concurrent User A"),
      updateInvoiceStatus(openAr.id, "mark_paid", "Concurrent User B"),
      updateInvoiceStatus(openAr.id, "mark_paid", "Concurrent User C"),
    ]);
    assert.equal(results.length, 3);
    for (const r of results) {
      assert.equal(r.status, "paid");
    }

    const settlementTx = await db
      .select()
      .from(transactions)
      .where(eq(transactions.reference, openAr.invoiceNumber));
    assert.equal(settlementTx.length, 1, "Must insert strictly one settlement ledger transaction");

    const afterOverview = await getFinancialOverview();
    assert.equal(
      afterOverview.kpis.totalRevenueCents,
      beforeOverview.kpis.totalRevenueCents + openAr.baseTotalCents,
      "Revenue must increase exactly once, never doubled",
    );

    // Paid invoices must not be reverted to unpaid status
    await assert.rejects(
      () => updateInvoiceStatus(openAr.id, "send", "QA CFO"),
      (err: unknown) => err instanceof AccountingError && err.status === 409,
    );
  });

  it("Regression #2: allocates strictly unique collision-safe invoice numbers across 40+ concurrent creations", async () => {
    await resetDemoWorkspace();
    const db = await getDb();
    const allAccounts = await db.select().from(accounts);
    const customer = allAccounts.find((a) => a.type === "customer");
    const vendor = allAccounts.find((a) => a.type === "vendor");
    assert.ok(customer && vendor, "Expected seeded customer and vendor accounts");

    // Direct allocator stress test under concurrency
    const directNumbers = await Promise.all(
      Array.from({ length: 20 }, (_, i) => allocateInvoiceNumber(i % 2 === 0 ? "receivable" : "payable")),
    );
    assert.equal(new Set(directNumbers).size, 20);

    // Full invoice creation stress test (40 invoices concurrently + sequentially)
    const concurrentBatch = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        createInvoiceWithItems(
          {
            direction: i % 2 === 0 ? "receivable" : "payable",
            accountId: i % 2 === 0 ? customer.id : vendor.id,
            currency: "USD",
            exchangeRate: 1,
            taxRatePct: 0,
            issueDate: "2026-11-20",
            dueDate: "2026-12-20",
            items: [{ description: `Concurrent Batch Item #${i + 1}`, quantity: 1, unitPriceCents: 10000 }],
          },
          "QA Batch",
        ),
      ),
    );

    const sequentialBatch = [];
    for (let i = 0; i < 15; i++) {
      sequentialBatch.push(
        await createInvoiceWithItems(
          {
            direction: "receivable",
            accountId: customer.id,
            currency: "USD",
            exchangeRate: 1,
            taxRatePct: 0,
            issueDate: "2026-11-21",
            dueDate: "2026-12-21",
            items: [{ description: `Sequential Batch Item #${i + 1}`, quantity: 1, unitPriceCents: 12500 }],
          },
          "QA Sequential",
        ),
      );
    }

    const createdNumbers = [...concurrentBatch, ...sequentialBatch].map((inv) => inv.invoiceNumber);
    assert.equal(createdNumbers.length, 40);
    assert.equal(new Set(createdNumbers).size, 40, "All 40 created invoice numbers must be unique");
  });

  it("Regression #3: requires explicit FX rate for foreign-currency bank entries and converts to USD cents", async () => {
    await resetDemoWorkspace();
    const db = await getDb();

    const [eurStatement] = await db
      .insert(bankStatements)
      .values({
        statementDate: "2026-11-20",
        description: "SEPA CREDIT VANGUARD MEDTECH",
        reference: "SEPA-EUR-1000",
        currency: "EUR",
        amountCents: 100000, // EUR 1,000.00
        status: "unmatched",
      })
      .returning();

    const txCountBefore = (await db.select().from(transactions)).length;

    // Missing exchangeRate for EUR must reject with HTTP 400 and leave DB untouched
    await assert.rejects(
      () =>
        reconcileBankStatement({
          statementId: eurStatement.id,
          actor: "QA Controller",
        }),
      (err: unknown) => err instanceof AccountingError && err.status === 400,
    );

    const [stillUnmatched] = await db
      .select()
      .from(bankStatements)
      .where(eq(bankStatements.id, eurStatement.id));
    assert.equal(stillUnmatched.status, "unmatched");
    assert.equal((await db.select().from(transactions)).length, txCountBefore);

    // Explicit positive exchangeRate = 1.10 converts EUR 1,000 -> USD 1,100 (110,000 cents)
    const reconciled = await reconcileBankStatement({
      statementId: eurStatement.id,
      exchangeRate: 1.1,
      actor: "QA Controller",
    });

    assert.equal(reconciled.statement.status, "reconciled");
    assert.equal(reconciled.statement.matchedTransactionId, reconciled.transactionId);

    const [postedTx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, reconciled.transactionId));
    assert.equal(postedTx.currency, "EUR");
    assert.equal(postedTx.amountCents, 100000);
    assert.equal(postedTx.baseAmountCents, 110000);
    assert.ok(Math.abs(postedTx.exchangeRate - 1.1) < 1e-5);
  });

  it("Regression #4: rejects repeat & concurrent bank reconciliation before creating duplicate ledger entries", async () => {
    await resetDemoWorkspace();
    const db = await getDb();

    const [st] = await db
      .insert(bankStatements)
      .values({
        statementDate: "2026-11-21",
        description: "STRIPE PAYOUT #991",
        reference: "STR-991",
        currency: "USD",
        amountCents: 75000,
        status: "unmatched",
      })
      .returning();

    const txCountBefore = (await db.select().from(transactions)).length;

    // First reconciliation succeeds
    const first = await reconcileBankStatement({
      statementId: st.id,
      actor: "QA Controller",
    });
    assert.equal(first.statement.status, "reconciled");
    assert.equal((await db.select().from(transactions)).length, txCountBefore + 1);

    // Repeat post & reconcile must fail with 409 and NOT create a second transaction or overwrite matchedTransactionId
    await assert.rejects(
      () =>
        reconcileBankStatement({
          statementId: st.id,
          actor: "QA Controller",
        }),
      (err: unknown) => err instanceof AccountingError && err.status === 409,
    );

    assert.equal((await db.select().from(transactions)).length, txCountBefore + 1);
    const [reloaded] = await db.select().from(bankStatements).where(eq(bankStatements.id, st.id));
    assert.equal(reloaded.matchedTransactionId, first.transactionId);

    // Concurrent reconciliation race on a second unmatched line -> strictly 1 succeeds, 1 rejects with 409
    const [stRace] = await db
      .insert(bankStatements)
      .values({
        statementDate: "2026-11-22",
        description: "CONCURRENT PAYOUT #992",
        reference: "STR-992",
        currency: "USD",
        amountCents: 60000,
        status: "unmatched",
      })
      .returning();

    const txCountBeforeRace = (await db.select().from(transactions)).length;
    const raceResults = await Promise.allSettled([
      reconcileBankStatement({ statementId: stRace.id, actor: "User A" }),
      reconcileBankStatement({ statementId: stRace.id, actor: "User B" }),
    ]);

    const fulfilled = raceResults.filter((r) => r.status === "fulfilled");
    const rejected = raceResults.filter((r) => r.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(
      rejected[0].status === "rejected" &&
        rejected[0].reason instanceof AccountingError &&
        rejected[0].reason.status === 409,
    );
    assert.equal((await db.select().from(transactions)).length, txCountBeforeRace + 1);
  });

  it("Regression #5: scopes budget actuals strictly to the monthly comparison window while keeping all-time P&L intact", async () => {
    await resetDemoWorkspace();
    const db = await getDb();

    const baseline = await getFinancialOverview();
    assert.equal(baseline.budgetMonth, "2026-11");

    // Seed has Cloud & Infrastructure in 2026-09 ($2,150) AND 2026-11 ($2,380).
    // Monthly budget actual for 2026-11 must ONLY count 2026-11 ($2,380 = 238000 cents).
    const cloudBudgetBaseline = baseline.budgetStatus.find((b) => b.category === "Cloud & Infrastructure");
    assert.ok(cloudBudgetBaseline);
    assert.equal(cloudBudgetBaseline.actualMonth, "2026-11");
    assert.equal(cloudBudgetBaseline.actualCents, 238000);
    assert.equal(cloudBudgetBaseline.overBudget, false);

    // All-time P&L expense line must still sum both 2026-09 + 2026-11 ($4,530 = 453000 cents)
    const cloudPnlBaseline = baseline.pnl.expenseLines.find((l) => l.category === "Cloud & Infrastructure");
    assert.equal(cloudPnlBaseline?.amountCents, 453000);

    // Insert a large expense in an earlier month (2026-07) — must NOT inflate 2026-11 budget utilization
    await db.insert(transactions).values({
      type: "expense",
      category: "Cloud & Infrastructure",
      description: "Historical July Annual Reserved Cluster",
      currency: "USD",
      exchangeRate: 1,
      amountCents: 900000,
      baseAmountCents: 900000,
      occurredAt: "2026-07-15",
      createdBy: "QA Controller",
    });

    const afterHistorical = await getFinancialOverview();
    const cloudBudgetAfterHist = afterHistorical.budgetStatus.find((b) => b.category === "Cloud & Infrastructure");
    assert.equal(cloudBudgetAfterHist?.actualCents, 238000, "Earlier month expense must not affect 2026-11 budget");
    assert.equal(cloudBudgetAfterHist?.overBudget, false);

    const cloudPnlAfterHist = afterHistorical.pnl.expenseLines.find((l) => l.category === "Cloud & Infrastructure");
    assert.equal(cloudPnlAfterHist?.amountCents, 1353000, "All-time P&L must still include earlier month expense");

    // Also verify a budget with an explicit YYYY-MM period (2026-10) scopes strictly to 2026-10
    await db
      .update(budgets)
      .set({ period: "2026-10" })
      .where(eq(budgets.category, "Payroll & Benefits"));

    const afterPeriodScope = await getFinancialOverview();
    const payrollBudget = afterPeriodScope.budgetStatus.find((b) => b.category === "Payroll & Benefits");
    assert.equal(payrollBudget?.actualMonth, "2026-10");
    assert.equal(payrollBudget?.actualCents, 1180000);

    // Restore clean demo workspace at end of test suite
    await resetDemoWorkspace();
  });
});
