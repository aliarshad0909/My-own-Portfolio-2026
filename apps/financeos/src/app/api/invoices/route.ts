import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { accounts } from "@/db/schema";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { AccountingError, createInvoiceWithItems, listEnrichedInvoices } from "@/lib/accounting";
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

  try {
    const created = await createInvoiceWithItems(parsed.data, auth.user.name);
    return NextResponse.json({ invoice: created }, { status: 201 });
  } catch (err) {
    const status = err instanceof AccountingError ? err.status : 400;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not create invoice" }, { status });
  }
}
