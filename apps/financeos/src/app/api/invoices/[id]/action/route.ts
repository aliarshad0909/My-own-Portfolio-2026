import { NextResponse } from "next/server";
import { isFinanceWriter, requireApiUser } from "@/lib/auth";
import { updateInvoiceStatus } from "@/lib/accounting";
import { checkRateLimit, clientKey, verifyCsrfOrigin } from "@/lib/security";
import { invoiceActionSchema } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isFinanceWriter(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = invoiceActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid action" }, { status: 400 });
  }

  try {
    const updated = await updateInvoiceStatus(id, parsed.data.action, auth.user.name);
    return NextResponse.json({ invoice: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Update failed" }, { status: 400 });
  }
}
