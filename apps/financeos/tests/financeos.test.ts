import assert from "node:assert/strict";
import { describe, it } from "node:test";

process.env.PGLITE_DATA_DIR = "memory://";
process.env.DATABASE_URL = "";
process.env.FINANCEOS_DATABASE_URL = "";

import { getDb, resetDemoWorkspace } from "@/db";
import { bankStatements, invoices, transactions } from "@/db/schema";
import {
  getFinancialOverview,
  listEnrichedInvoices,
  parseBankStatementCsv,
  toBaseUsdCents,
  updateInvoiceStatus,
} from "@/lib/accounting";
import { generateLockedPassword, hashPassword, resolveSessionSecret, verifyPassword } from "@/lib/crypto";
import { verifyCsrfOrigin } from "@/lib/security";

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

  it("converts multi-currency cents cleanly and parses CSV bank statements", () => {
    assert.equal(toBaseUsdCents(100000, 1.08), 108000);
    const rows = parseBankStatementCsv(
      "date,description,amount,currency,reference\n2026-11-20,WIRE IN,1250.50,USD,REF-1\n2026-11-21,CLOUD BILL,-300.25,USD,REF-2",
    );
    assert.equal(rows.length, 2);
    assert.equal(rows[0].amountCents, 125050);
    assert.equal(rows[1].amountCents, -30025);
  });
});

describe("FinanceOS PostgreSQL ERP workflows", () => {
  it("computes P&L/Cash-Flow from DB, settles AR invoice atomically into ledger, imports CSV, and resets", async () => {
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
});
