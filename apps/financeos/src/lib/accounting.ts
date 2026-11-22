import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb, type FinanceDb } from "@/db";
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

const YYYY_MM_RE = /^\d{4}-\d{2}$/;

export class AccountingError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AccountingError";
    this.status = status;
  }
}

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
 * RFC-4180 quote-aware CSV parser that preserves commas inside quoted fields,
 * unescapes doubled quotes (`""`), and handles LF/CRLF line endings.
 */
export function parseCsvRows(csvText: string): string[][] {
  const input = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"' && field.trim() === "") {
      field = "";
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && input[i + 1] === "\n") {
        i++;
      }
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

/**
 * Parses CSV bank statement text (`date,description,amount,currency,reference`).
 * Supports RFC-4180 quoted fields (commas in descriptions, escaped quotes, thousands-separated amounts),
 * accepts either header or headerless rows, and converts decimal amounts to integer cents.
 */
export function parseBankStatementCsv(csvText: string): {
  statementDate: string;
  description: string;
  amountCents: number;
  currency: string;
  reference: string;
}[] {
  const rows = parseCsvRows(csvText);

  const parsed: {
    statementDate: string;
    description: string;
    amountCents: number;
    currency: string;
    reference: string;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (i === 0 && cols[0]?.toLowerCase() === "date") continue;
    if (cols.length < 3) continue;
    const [rawDate, rawDescription, rawAmount, rawCurrency = "USD", rawReference = ""] = cols;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) continue;

    const stripped = rawAmount.replace(/[$,\s]/g, "");
    const numeric = /^\(.+\)$/.test(stripped) ? -Number(stripped.slice(1, -1)) : Number(stripped);
    if (!Number.isFinite(numeric) || numeric === 0) continue;

    const cleanDescription = rawDescription.replace(/\s+/g, " ").trim();
    parsed.push({
      statementDate: rawDate,
      description: cleanDescription.slice(0, 180) || "Imported bank entry",
      amountCents: Math.round(numeric * 100),
      currency: (rawCurrency || "USD").toUpperCase().slice(0, 5),
      reference: rawReference.slice(0, 60),
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
 * Allocates a collision-safe sequential AR invoice or AP bill number backed by
 * PostgreSQL sequences (`financeos_ar_invoice_seq` / `financeos_ap_bill_seq`).
 */
export async function allocateInvoiceNumber(
  direction: "receivable" | "payable",
  executor?: Pick<FinanceDb, "execute">,
): Promise<string> {
  const db = executor ?? (await getDb());
  const prefix = direction === "receivable" ? "INV" : "BILL";
  const year = new Date().getUTCFullYear();
  const result =
    direction === "receivable"
      ? await db.execute(sql`SELECT nextval('financeos_ar_invoice_seq')::text AS seq`)
      : await db.execute(sql`SELECT nextval('financeos_ap_bill_seq')::text AS seq`);

  const rows = (result as { rows?: { seq?: string }[] }).rows ?? [];
  const seq = rows[0]?.seq;
  if (!seq) {
    throw new AccountingError("Failed to allocate sequential invoice number", 500);
  }
  return `${prefix}-${year}-${seq}`;
}

export type CreateInvoiceInput = {
  direction: "receivable" | "payable";
  accountId: string;
  currency: string;
  exchangeRate: number;
  taxRatePct: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPriceCents: number;
  }[];
};

/**
 * Atomically allocates a collision-safe invoice number, inserts the invoice,
 * line items, and audit record inside a single transaction.
 */
export async function createInvoiceWithItems(data: CreateInvoiceInput, actor: string) {
  const subtotalCents = data.items.reduce((s, item) => s + item.quantity * item.unitPriceCents, 0);
  const taxCents = Math.round(subtotalCents * (data.taxRatePct / 100));
  const totalCents = subtotalCents + taxCents;
  const baseTotalCents = toBaseUsdCents(totalCents, data.exchangeRate);

  const db = await getDb();
  return db.transaction(async (tx) => {
    const invoiceNumber = await allocateInvoiceNumber(data.direction, tx);
    const [inv] = await tx
      .insert(invoices)
      .values({
        invoiceNumber,
        direction: data.direction,
        accountId: data.accountId,
        status: "draft",
        currency: data.currency.toUpperCase(),
        exchangeRate: data.exchangeRate,
        subtotalCents,
        taxRatePct: data.taxRatePct,
        taxCents,
        totalCents,
        baseTotalCents,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes ?? "",
      })
      .returning();

    await tx.insert(invoiceItems).values(
      data.items.map((item) => ({
        invoiceId: inv.id,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.quantity * item.unitPriceCents,
      })),
    );

    await tx.insert(auditLogs).values({
      action: "INVOICE_CREATED",
      entityType: "invoice",
      entityId: inv.id,
      summary: `Created ${data.direction} ${invoiceNumber} (${inv.currency} ${(totalCents / 100).toFixed(2)}).`,
      actor,
    });

    return inv;
  });
}

/**
 * Computes live P&L, Cash-Flow, AR/AP, Monthly Budgets vs Actuals, and Monthly Trend
 * directly from PostgreSQL records using documented integer-cent rules.
 */
export async function getFinancialOverview(options?: { budgetMonth?: string }) {
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
  const monthlyExpenseByCategory = new Map<string, Map<string, number>>();
  const monthlyMap = new Map<string, { month: string; inflowCents: number; outflowCents: number }>();
  let latestLedgerMonth = "";

  for (const tx of allTx) {
    const month = tx.occurredAt.slice(0, 7);
    if (YYYY_MM_RE.test(month) && month > latestLedgerMonth) {
      latestLedgerMonth = month;
    }
    const bucket = monthlyMap.get(month) ?? { month, inflowCents: 0, outflowCents: 0 };

    if (isInflow(tx.type)) {
      totalRevenueCents += tx.baseAmountCents;
      bucket.inflowCents += tx.baseAmountCents;
      revenueByCategory.set(tx.category, (revenueByCategory.get(tx.category) ?? 0) + tx.baseAmountCents);
    } else {
      bucket.outflowCents += tx.baseAmountCents;
      expenseByCategory.set(tx.category, (expenseByCategory.get(tx.category) ?? 0) + tx.baseAmountCents);

      if (YYYY_MM_RE.test(month)) {
        let monthCategories = monthlyExpenseByCategory.get(month);
        if (!monthCategories) {
          monthCategories = new Map<string, number>();
          monthlyExpenseByCategory.set(month, monthCategories);
        }
        monthCategories.set(tx.category, (monthCategories.get(tx.category) ?? 0) + tx.baseAmountCents);
      }

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

  // Scope budget actuals strictly to the relevant monthly comparison window (YYYY-MM)
  // rather than all-time historical expenses, while keeping all-time P&L totals intact.
  const budgetMonth =
    options?.budgetMonth && YYYY_MM_RE.test(options.budgetMonth)
      ? options.budgetMonth
      : latestLedgerMonth || new Date().toISOString().slice(0, 7);

  const budgetStatus = allBudgets.map((b) => {
    const actualMonth = YYYY_MM_RE.test(b.period) ? b.period : budgetMonth;
    const actualCents = monthlyExpenseByCategory.get(actualMonth)?.get(b.category) ?? 0;
    const utilizationPct = b.monthlyLimitCents > 0 ? Math.round((actualCents / b.monthlyLimitCents) * 100) : 0;
    return {
      ...b,
      actualMonth,
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
    budgetMonth,
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
 * Serializes and atomically updates invoice status. When marking an invoice paid,
 * acquires a row-level `FOR UPDATE` lock and executes a conditional unpaid→paid
 * transition so concurrent settlement requests can never post duplicate ledger entries.
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  action: "send" | "mark_paid" | "mark_overdue",
  actor: string,
) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .for("update")
      .limit(1);
    if (!locked) throw new AccountingError("Invoice not found", 404);

    if (action === "mark_paid") {
      if (locked.status === "paid") {
        // Idempotent no-op: already settled, never insert a second ledger transaction.
        return locked;
      }

      const paidAt = new Date().toISOString().slice(0, 10);
      const [updated] = await tx
        .update(invoices)
        .set({ status: "paid", paidAt })
        .where(and(eq(invoices.id, locked.id), ne(invoices.status, "paid")))
        .returning();

      if (!updated) {
        const [current] = await tx.select().from(invoices).where(eq(invoices.id, locked.id)).limit(1);
        return current ?? locked;
      }

      const txType = updated.direction === "receivable" ? "sale" : "purchase";
      const category = updated.direction === "receivable" ? "SaaS & Software Revenue" : "Cost of Goods Sold";
      await tx.insert(transactions).values({
        type: txType,
        category,
        description: `Settlement for ${updated.invoiceNumber}`,
        accountId: updated.accountId,
        reference: updated.invoiceNumber,
        currency: updated.currency,
        exchangeRate: updated.exchangeRate,
        amountCents: updated.totalCents,
        baseAmountCents: updated.baseTotalCents,
        status: "cleared",
        reconciled: 0,
        occurredAt: paidAt,
        createdBy: actor,
      });

      await tx.insert(auditLogs).values({
        action: "INVOICE_PAID",
        entityType: "invoice",
        entityId: updated.id,
        summary: `${updated.invoiceNumber} transitioned from ${locked.status} to paid.`,
        actor,
      });

      return updated;
    }

    if (locked.status === "paid") {
      throw new AccountingError("Paid invoices cannot be reverted to unpaid status", 409);
    }

    const nextStatus = action === "send" ? "sent" : "overdue";
    const [updated] = await tx
      .update(invoices)
      .set({ status: nextStatus })
      .where(and(eq(invoices.id, locked.id), ne(invoices.status, "paid")))
      .returning();

    if (!updated) {
      throw new AccountingError("Paid invoices cannot be reverted to unpaid status", 409);
    }

    await tx.insert(auditLogs).values({
      action: `INVOICE_${nextStatus.toUpperCase()}`,
      entityType: "invoice",
      entityId: updated.id,
      summary: `${updated.invoiceNumber} transitioned from ${locked.status} to ${nextStatus}.`,
      actor,
    });

    return updated;
  });
}

/**
 * Atomically reconciles an unmatched bank statement line by either matching an existing
 * unreconciled ledger transaction or posting a new FX-converted ledger entry.
 * Locks the bank statement row (`FOR UPDATE`) and rejects already-reconciled statements
 * with HTTP 409 before creating any ledger transaction.
 */
export async function reconcileBankStatement(params: {
  statementId: string;
  transactionId?: string;
  createLedgerCategory?: string;
  exchangeRate?: number;
  actor: string;
}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [st] = await tx
      .select()
      .from(bankStatements)
      .where(eq(bankStatements.id, params.statementId))
      .for("update")
      .limit(1);

    if (!st) {
      throw new AccountingError("Bank statement line not found", 404);
    }

    if (st.status === "reconciled") {
      throw new AccountingError("Bank statement line is already reconciled", 409);
    }

    const currency = (st.currency || "USD").toUpperCase();
    let txId = params.transactionId;

    if (!txId) {
      let effectiveRate = 1;
      if (currency !== "USD") {
        if (
          typeof params.exchangeRate !== "number" ||
          !Number.isFinite(params.exchangeRate) ||
          params.exchangeRate <= 0
        ) {
          throw new AccountingError(
            `A positive conversion rate to USD (exchangeRate) is required to post a ${currency} bank statement line.`,
            400,
          );
        }
        effectiveRate = params.exchangeRate;
      }

      const absAmountCents = Math.abs(st.amountCents);
      const baseAmountCents = toBaseUsdCents(absAmountCents, effectiveRate);

      const [newTx] = await tx
        .insert(transactions)
        .values({
          type: st.amountCents > 0 ? "income" : "expense",
          category:
            params.createLedgerCategory || (st.amountCents > 0 ? "Miscellaneous Income" : "Bank Operating Expense"),
          description: st.description,
          reference: st.reference,
          currency,
          exchangeRate: effectiveRate,
          amountCents: absAmountCents,
          baseAmountCents,
          status: "cleared",
          reconciled: 1,
          occurredAt: st.statementDate,
          createdBy: params.actor,
        })
        .returning();
      txId = newTx.id;
    } else {
      const [targetTx] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, txId))
        .for("update")
        .limit(1);

      if (!targetTx) {
        throw new AccountingError("Target ledger transaction not found", 404);
      }
      if (targetTx.reconciled === 1) {
        throw new AccountingError("Target ledger transaction is already reconciled", 409);
      }

      await tx.update(transactions).set({ reconciled: 1 }).where(eq(transactions.id, txId));
    }

    const [updated] = await tx
      .update(bankStatements)
      .set({ status: "reconciled", matchedTransactionId: txId })
      .where(and(eq(bankStatements.id, st.id), ne(bankStatements.status, "reconciled")))
      .returning();

    if (!updated) {
      throw new AccountingError("Bank statement line is already reconciled", 409);
    }

    await tx.insert(auditLogs).values({
      action: "BANK_RECONCILED",
      entityType: "bank_statement",
      entityId: st.id,
      summary: `Reconciled bank line "${st.description}" (${currency} ${(st.amountCents / 100).toFixed(2)}) with ledger entry.`,
      actor: params.actor,
    });

    return { statement: updated, transactionId: txId };
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
