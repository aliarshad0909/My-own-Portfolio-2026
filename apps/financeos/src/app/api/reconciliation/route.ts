import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { auditLogs, bankStatements, transactions } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { isInflow, logAudit, parseBankStatementCsv } from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { csvImportSchema, reconcileSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [statements, allTx] = await Promise.all([
    db.select().from(bankStatements).orderBy(desc(bankStatements.statementDate), desc(bankStatements.importedAt)),
    db.select().from(transactions).orderBy(desc(transactions.occurredAt)),
  ]);

  const enriched = statements.map((st) => {
    const absAmount = Math.abs(st.amountCents);
    const expectsInflow = st.amountCents > 0;
    const suggestedMatch =
      st.status === "unmatched"
        ? allTx.find(
            (tx) =>
              tx.reconciled === 0 &&
              isInflow(tx.type) === expectsInflow &&
              Math.abs(tx.baseAmountCents - absAmount) <= 100,
          ) ?? null
        : null;

    return {
      ...st,
      suggestedTransactionId: suggestedMatch?.id ?? null,
      suggestedDescription: suggestedMatch?.description ?? null,
    };
  });

  return NextResponse.json({
    statements: enriched,
    unreconciledTransactions: allTx.filter((t) => t.reconciled === 0),
  });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "csv-import"), 20, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = csvImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid CSV" }, { status: 400 });
  }

  const rows = parseBankStatementCsv(parsed.data.csvText);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No valid CSV rows parsed. Expected columns: date (YYYY-MM-DD), description, amount, currency, reference." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const inserted = await db
    .insert(bankStatements)
    .values(rows.map((r) => ({ ...r, status: "unmatched" })))
    .returning();

  await logAudit({
    action: "CSV_BANK_IMPORT",
    entityType: "bank_statement",
    summary: `Imported ${inserted.length} bank statement row(s) from CSV.`,
    actor: auth.user.name,
  });

  return NextResponse.json({ importedCount: inserted.length, statements: inserted }, { status: 201 });
}

export async function PATCH(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = reconcileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid reconciliation request" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const result = await db.transaction(async (tx) => {
      const [st] = await tx
        .select()
        .from(bankStatements)
        .where(eq(bankStatements.id, parsed.data.statementId))
        .limit(1);
      if (!st) throw new Error("Bank statement line not found");

      let txId = parsed.data.transactionId;
      if (!txId) {
        const [newTx] = await tx
          .insert(transactions)
          .values({
            type: st.amountCents > 0 ? "income" : "expense",
            category: parsed.data.createLedgerCategory || (st.amountCents > 0 ? "Miscellaneous Income" : "Bank Operating Expense"),
            description: st.description,
            reference: st.reference,
            currency: st.currency,
            exchangeRate: 1,
            amountCents: Math.abs(st.amountCents),
            baseAmountCents: Math.abs(st.amountCents),
            status: "cleared",
            reconciled: 1,
            occurredAt: st.statementDate,
            createdBy: auth.user.name,
          })
          .returning();
        txId = newTx.id;
      } else {
        await tx.update(transactions).set({ reconciled: 1 }).where(eq(transactions.id, txId));
      }

      const [updated] = await tx
        .update(bankStatements)
        .set({ status: "reconciled", matchedTransactionId: txId })
        .where(eq(bankStatements.id, st.id))
        .returning();

      await tx.insert(auditLogs).values({
        action: "BANK_RECONCILED",
        entityType: "bank_statement",
        entityId: st.id,
        summary: `Reconciled bank line "${st.description}" (${(st.amountCents / 100).toFixed(2)}) with ledger entry.`,
        actor: auth.user.name,
      });

      return updated;
    });
    return NextResponse.json({ statement: result });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Reconciliation failed" }, { status: 400 });
  }
}
