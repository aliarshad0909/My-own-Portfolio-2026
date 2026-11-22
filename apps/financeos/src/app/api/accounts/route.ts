import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { accounts, invoices } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { logAudit } from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { accountCreateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [allAccounts, allInvoices] = await Promise.all([
    db.select().from(accounts).orderBy(desc(accounts.createdAt)),
    db.select().from(invoices),
  ]);

  const enriched = allAccounts.map((acct) => {
    const related = allInvoices.filter((inv) => inv.accountId === acct.id);
    const openBalanceCents = related
      .filter((inv) => inv.status !== "paid")
      .reduce((s, inv) => s + inv.baseTotalCents, 0);
    const paidTotalCents = related
      .filter((inv) => inv.status === "paid")
      .reduce((s, inv) => s + inv.baseTotalCents, 0);
    return {
      ...acct,
      invoiceCount: related.length,
      openBalanceCents,
      paidTotalCents,
    };
  });

  return NextResponse.json({ accounts: enriched });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = accountCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid account" }, { status: 400 });
  }

  const db = await getDb();
  const [created] = await db
    .insert(accounts)
    .values({ ...parsed.data, currency: parsed.data.currency.toUpperCase() })
    .returning();

  await logAudit({
    action: "ACCOUNT_CREATED",
    entityType: "account",
    entityId: created.id,
    summary: `Added ${created.type} account "${created.name}" (${created.currency}).`,
    actor: auth.user.name,
  });

  return NextResponse.json({ account: created }, { status: 201 });
}
