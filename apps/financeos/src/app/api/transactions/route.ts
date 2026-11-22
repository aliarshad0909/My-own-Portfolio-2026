import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { logAudit, toBaseUsdCents } from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { transactionCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type") || "all";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const db = await getDb();
  const [rows, allAccounts] = await Promise.all([
    db.select().from(transactions).orderBy(desc(transactions.occurredAt), desc(transactions.createdAt)),
    db.select().from(accounts),
  ]);
  const acctMap = new Map(allAccounts.map((a) => [a.id, a]));

  const filtered = rows
    .map((tx) => ({
      ...tx,
      accountName: tx.accountId ? acctMap.get(tx.accountId)?.name ?? null : null,
    }))
    .filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (q) {
        const hay = `${tx.description} ${tx.category} ${tx.reference} ${tx.accountName ?? ""} ${tx.currency}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

  return NextResponse.json({ transactions: filtered, accounts: allAccounts });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = transactionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid transaction" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();
  const baseAmountCents = toBaseUsdCents(data.amountCents, data.exchangeRate);

  const [created] = await db
    .insert(transactions)
    .values({
      type: data.type,
      category: data.category,
      description: data.description,
      accountId: data.accountId || null,
      reference: data.reference,
      currency: data.currency.toUpperCase(),
      exchangeRate: data.exchangeRate,
      amountCents: data.amountCents,
      baseAmountCents,
      status: data.status,
      reconciled: 0,
      occurredAt: data.occurredAt,
      createdBy: auth.user.name,
    })
    .returning();

  await logAudit({
    action: `TX_${data.type.toUpperCase()}`,
    entityType: "transaction",
    entityId: created.id,
    summary: `Recorded ${data.type} "${data.description}" (${data.currency} ${(data.amountCents / 100).toFixed(2)} → USD ${(baseAmountCents / 100).toFixed(2)}).`,
    actor: auth.user.name,
  });

  return NextResponse.json({ transaction: created }, { status: 201 });
}

export async function DELETE(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid transaction ID" }, { status: 400 });

  const db = await getDb();
  const [deleted] = await db.delete(transactions).where(eq(transactions.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

  await logAudit({
    action: "TX_DELETED",
    entityType: "transaction",
    entityId: deleted.id,
    summary: `Deleted ledger transaction "${deleted.description}".`,
    actor: auth.user.name,
  });

  return NextResponse.json({ ok: true });
}
