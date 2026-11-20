import { NextResponse } from "next/server";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { applySalesOrderAction } from "@/lib/inventory";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { salesOrderActionSchema } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid sales order ID" }, { status: 400 });

  const body = await request.json().catch(() => null);
  const parsed = salesOrderActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order action" }, { status: 400 });
  }

  try {
    const updated = await applySalesOrderAction({
      soId: id,
      ...parsed.data,
      performedBy: auth.user.name,
    });
    return NextResponse.json({ salesOrder: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Order action failed" }, { status: 400 });
  }
}

