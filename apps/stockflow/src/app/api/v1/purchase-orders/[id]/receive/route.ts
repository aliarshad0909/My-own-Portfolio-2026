import { NextResponse } from "next/server";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { receivePurchaseOrder } from "@/lib/inventory";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid purchase order ID" }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { source?: "web" | "mobile" };
  try {
    const updated = await receivePurchaseOrder(id, auth.user.name, body.source === "mobile" ? "mobile" : "web");
    return NextResponse.json({ purchaseOrder: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to receive order" }, { status: 400 });
  }
}

