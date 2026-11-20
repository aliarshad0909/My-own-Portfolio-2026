import { NextResponse } from "next/server";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { transferStock } from "@/lib/inventory";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { stockTransferSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 120, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = stockTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid stock transfer" }, { status: 400 });
  }

  try {
    const result = await transferStock({
      ...parsed.data,
      performedBy: auth.user.name,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Transfer failed" }, { status: 400 });
  }
}

