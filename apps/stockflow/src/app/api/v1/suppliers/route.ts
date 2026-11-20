import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { suppliers } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { supplierCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const db = await getDb();
  const rows = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  return NextResponse.json({ suppliers: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = supplierCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid supplier data" }, { status: 400 });
  }

  const db = await getDb();
  const [created] = await db.insert(suppliers).values(parsed.data).returning();
  return NextResponse.json({ supplier: created }, { status: 201 });
}

