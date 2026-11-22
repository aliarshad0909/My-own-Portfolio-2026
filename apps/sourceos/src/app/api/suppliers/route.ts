import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { suppliers } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createSupplierSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  const db = await getDb();
  const rows = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  return NextResponse.json({ suppliers: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const rl = checkRateLimit(clientKey(request, "suppliers-write"), 40, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSupplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid supplier data." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db.insert(suppliers).values(parsed.data).returning();
  return NextResponse.json({ supplier: created }, { status: 201 });
}
