import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  accounts,
  auditLogs,
  bankStatements,
  budgets,
  currencyRates,
  invoiceItems,
  invoices,
  transactions,
} from "@/db/schema";

export function isInflow(type: string): boolean {
  return type === "income" || type === "sale";
}

export function isCogs(type: string, category: string): boolean {
  return type === "purchase" || category.toLowerCase().includes("cost of goods");
}

export function toBaseUsdCents(amountCents: number, exchangeRate: number): number {
  return Math.round(amountCents * exchangeRate);
}

/**
 * Parses CSV bank statement text (`date,description,amount,currency,reference`).
 * Accepts either header or headerless rows and converts decimal amounts to integer cents.
 */
export function parseBankStatementCsv(csvText: string): {
  statementDate: string;
  description: string;
  amountCents: number;
  currency: string;
  reference: string;
}[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed: {
    statementDate: string;
    description: string;
    amountCents: number;
    currency: string;
    reference: string;
  }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && /^date\s*,/i.test(line)) continue;
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;
    const [rawDate, description, rawAmount, rawCurrency = "USD", reference = ""] = cols;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) continue;
    const numeric = Number(rawAmount.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(numeric) || numeric === 0) continue;
    parsed.push({
      statementDate: rawDate,
      description: description.slice(0, 180) || "Imported bank entry",
      amountCents: Math.round(numeric * 100),
      currency: (rawCurrency || "USD").toUpperCase().slice(0, 5),
      reference: reference.slice(0, 60),
    });
  }
  return parsed;
}

export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  actor: string;
}) {
  const db = await getDb();
  await db.insert(auditLogs).values({
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId || "",
    summary: params.summary,
    actor: params.actor,
  });
}

/**
 * Computes live P&L, Cash-Flow, AR/AP, Budgets vs Actuals, and Monthly Trend
 * directly from PostgreSQL records using documented integer-cent rules.
 */
export async function getFinancialOverview() {
  const db = await getDb();
  const [allTx, allInv, allAccounts, allBudgets, allStatements, allRates, recentLogs] = await Promise.all([
    db.select().from(transactions).orderBy(desc(transactions.occurredAt)),
    db.select().from(invoices).orderBy(desc(invoices.issueDate)),
    db.select().from(accounts),
    db.select().from(budgets),
    db.select().from(bankStatements).orderBy(desc(bankStatements.statementDate)),
    db.select().from(currencyRates),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(20),
  ]);

  const acctMap = new Map(allAccounts.map((a) => [a.id, a]));

  let totalRevenueCents = 0;
  let totalCogsCents = 0;
  let totalOperatingExpensesCents = 0;

  const revenueByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();
  const monthlyMap = new Map<string, { month: string; inflowCents: number; outflowCents: number }>();

  for (const tx of allTx) {
    const month = tx.occurredAt.slice(0, 7);
    const bucket = monthlyMap.get(month) ?? { month, inflowCents: 0, outflowCents: 0 };

    if (isInflow(tx.type)) {
      totalRevenueCents += tx.baseAmountCents;
      bucket.inflowCents += tx.baseAmountCents;
      revenueByCategory.set(tx.category, (revenueByCategory.get(tx.category) ?? 0) + tx.baseAmountCents);
    } else {
      bucket.outflowCents += tx.baseAmountCents;
      expenseByCategory.set(tx.category, (expenseByCategory.get(tx.category) ?? 0) + tx.baseAmountCents);
      if (isCogs(tx.type, tx.category)) {
        totalCogsCents += tx.baseAmountCents;
      } else {
        totalOperatingExpensesCents += tx.baseAmountCents;
      }
    }
    monthlyMap.set(month, bucket);
  }

  const grossProfitCents = totalRevenueCents - totalCogsCents;
  const totalOutflowCents = totalCogsCents + totalOperatingExpensesCents;
  const netProfitCents = totalRevenueCents - totalOutflowCents;
  const netMarginPct = totalRevenueCents > 0 ? Number(((netProfitCents / totalRevenueCents) * 100).toFixed(1)) : 0;

  // Opening demonstration cash reserve ($45,000) + net cleared cash flow
  const openingCashCents = 4_500_000;
  const cashBalanceCents = openingCashCents + netProfitCents;

  const openReceivablesCents = allInv
    .filter((i) => i.direction === "receivable" && i.status !== "paid")
    .reduce((sum, i) => sum + i.baseTotalCents, 0);

  const overdueReceivablesCents = allInv
    .filter((i) => i.direction === "receivable" && i.status === "overdue")
    .reduce((sum, i) => sum + i.baseTotalCents, 0);

  const openPayablesCents = allInv
    .filter((i) => i.direction === "payable" && i.status !== "paid")
    .reduce((sum, i) => sum + i.baseTotalCents, 0);

  const monthlyCashFlow = Array.from(monthlyMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => ({
      ...m,
      netCents: m.inflowCents - m.outflowCents,
    }));

  const budgetStatus = allBudgets.map((b) => {
    const actualCents = expenseByCategory.get(b.category) ?? 0;
    const utilizationPct = b.monthlyLimitCents > 0 ? Math.round((actualCents / b.monthlyLimitCents) * 100) : 0;
    return {
      ...b,
      actualCents,
      varianceCents: b.monthlyLimitCents - actualCents,
      utilizationPct,
      overBudget: actualCents > b.monthlyLimitCents,
    };
  });

  const unmatchedBankCount = allStatements.filter((s) => s.status !== "reconciled").length;

  return {
    companyName: "Meridian Digital Commerce LLC (Fictional Demo)",
    baseCurrency: "USD",
    kpis: {
      totalRevenueCents,
      totalCogsCents,
      grossProfitCents,
      totalOperatingExpensesCents,
      totalOutflowCents,
      netProfitCents,
      netMarginPct,
      cashBalanceCents,
      openReceivablesCents,
      overdueReceivablesCents,
      openPayablesCents,
      unmatchedBankCount,
      totalTransactions: allTx.length,
    },
    monthlyCashFlow,
    pnl: {
      revenueLines: Array.from(revenueByCategory.entries()).map(([category, amountCents]) => ({
        category,
        amountCents,
      })),
      expenseLines: Array.from(expenseByCategory.entries()).map(([category, amountCents]) => ({
        category,
        amountCents,
      })),
    },
    budgetStatus,
    currencyRates: allRates,
    recentInvoices: allInv.slice(0, 6).map((inv) => ({
      ...inv,
      accountName: acctMap.get(inv.accountId)?.name ?? "Account",
    })),
    recentTransactions: allTx.slice(0, 8).map((tx) => ({
      ...tx,
      accountName: tx.accountId ? acctMap.get(tx.accountId)?.name ?? null : null,
    })),
    auditLogs: recentLogs,
  };
}

/**
 * Atomically updates invoice status and posts the corresponding revenue/expense
 * ledger transaction when marked paid.
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  action: "send" | "mark_paid" | "mark_overdue",
  actor: string,
) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [inv] = await tx.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!inv) throw new Error("Invoice not found");

    const nextStatus = action === "send" ? "sent" : action === "mark_paid" ? "paid" : "overdue";
    const paidAt = action === "mark_paid" ? new Date().toISOString().slice(0, 10) : inv.paidAt;

    const [updated] = await tx
      .update(invoices)
      .set({ status: nextStatus, paidAt })
      .where(eq(invoices.id, inv.id))
      .returning();

    if (action === "mark_paid" && inv.status !== "paid") {
      const txType = inv.direction === "receivable" ? "sale" : "purchase";
      const category = inv.direction === "receivable" ? "SaaS & Software Revenue" : "Cost of Goods Sold";
      await tx.insert(transactions).values({
        type: txType,
        category,
        description: `Settlement for ${inv.invoiceNumber}`,
        accountId: inv.accountId,
        reference: inv.invoiceNumber,
        currency: inv.currency,
        exchangeRate: inv.exchangeRate,
        amountCents: inv.totalCents,
        baseAmountCents: inv.baseTotalCents,
        status: "cleared",
        reconciled: 0,
        occurredAt: paidAt || new Date().toISOString().slice(0, 10),
        createdBy: actor,
      });
    }

    await tx.insert(auditLogs).values({
      action: `INVOICE_${nextStatus.toUpperCase()}`,
      entityType: "invoice",
      entityId: inv.id,
      summary: `${inv.invoiceNumber} transitioned from ${inv.status} to ${nextStatus}.`,
      actor,
    });

    return updated;
  });
}

export async function listEnrichedInvoices() {
  const db = await getDb();
  const [allInv, allItems, allAccounts] = await Promise.all([
    db.select().from(invoices).orderBy(desc(invoices.createdAt)),
    db.select().from(invoiceItems),
    db.select().from(accounts),
  ]);
  const acctMap = new Map(allAccounts.map((a) => [a.id, a]));
  return allInv.map((inv) => ({
    ...inv,
    accountName: acctMap.get(inv.accountId)?.name ?? "Account",
    items: allItems.filter((item) => item.invoiceId === inv.id),
  }));
}
