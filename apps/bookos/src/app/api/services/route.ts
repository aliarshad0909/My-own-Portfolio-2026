import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, services } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { serviceCreateSchema } from "@/lib/validation";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "service"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db.select().from(services).orderBy(asc(services.createdAt));
  return NextResponse.json({ services: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "services-write"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = serviceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid service payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [created] = await db
    .insert(services)
    .values({
      ...parsed.data,
      slug: slugify(parsed.data.name),
    })
    .returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "service.created",
    entityType: "service",
    entityId: created.id,
    summary: `Added service "${created.name}" (${created.durationMins}m + ${created.bufferMins}m buffer).`,
  });

  return NextResponse.json({ service: created }, { status: 201 });
}
