import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { isAllowedOpsRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { customerCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  const db = await getDb();
  const rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
  return NextResponse.json({ customers: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request);
  if ("error" in auth) return auth.error;
  if (!isAllowedOpsRole(auth.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = customerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid customer data" }, { status: 400 });
  }

  const db = await getDb();
  const [created] = await db.insert(customers).values(parsed.data).returning();
  return NextResponse.json({ customer: created }, { status: 201 });
}

