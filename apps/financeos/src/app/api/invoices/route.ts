import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { accounts, auditLogs, invoiceItems, invoices } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { listEnrichedInvoices, toBaseUsdCents } from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { invoiceCreateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const [enriched, allAccounts] = await Promise.all([listEnrichedInvoices(), db.select().from(accounts)]);
  return NextResponse.json({ invoices: enriched, accounts: allAccounts });
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
  const parsed = invoiceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid invoice data" }, { status: 400 });
  }

  const data = parsed.data;
  const subtotalCents = data.items.reduce((s, item) => s + item.quantity * item.unitPriceCents, 0);
  const taxCents = Math.round(subtotalCents * (data.taxRatePct / 100));
  const totalCents = subtotalCents + taxCents;
  const baseTotalCents = toBaseUsdCents(totalCents, data.exchangeRate);
  const prefix = data.direction === "receivable" ? "INV" : "BILL";
  const invoiceNumber = `${prefix}-2026-${Math.floor(500 + Math.random() * 499)}`;

  const db = await getDb();
  const created = await db.transaction(async (tx) => {
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
        notes: data.notes,
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
      actor: auth.user.name,
    });

    return inv;
  });

  return NextResponse.json({ invoice: created }, { status: 201 });
}
