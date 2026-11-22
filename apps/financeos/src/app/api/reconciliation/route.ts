import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { bankStatements, currencyRates, transactions } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import {
  AccountingError,
  isInflow,
  logAudit,
  parseBankStatementCsv,
  reconcileBankStatement,
} from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { csvImportSchema, reconcileSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [statements, allTx, allRates] = await Promise.all([
    db.select().from(bankStatements).orderBy(desc(bankStatements.statementDate), desc(bankStatements.importedAt)),
    db.select().from(transactions).orderBy(desc(transactions.occurredAt)),
    db.select().from(currencyRates),
  ]);

  const enriched = statements.map((st) => {
    const absAmount = Math.abs(st.amountCents);
    const expectsInflow = st.amountCents > 0;
    const stCurrency = (st.currency || "USD").toUpperCase();
    const suggestedMatch =
      st.status === "unmatched"
        ? allTx.find((tx) => {
            if (tx.reconciled !== 0 || isInflow(tx.type) !== expectsInflow) return false;
            if (stCurrency === "USD") {
              return Math.abs(tx.baseAmountCents - absAmount) <= 100;
            }
            return (tx.currency || "USD").toUpperCase() === stCurrency && Math.abs(tx.amountCents - absAmount) <= 100;
          }) ?? null
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
    currencyRates: allRates,
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

  try {
    const result = await reconcileBankStatement({
      statementId: parsed.data.statementId,
      transactionId: parsed.data.transactionId,
      createLedgerCategory: parsed.data.createLedgerCategory,
      exchangeRate: parsed.data.exchangeRate,
      actor: auth.user.name,
    });
    return NextResponse.json({ statement: result.statement, transactionId: result.transactionId });
  } catch (err) {
    const status = err instanceof AccountingError ? err.status : 400;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Reconciliation failed" }, { status });
  }
}
