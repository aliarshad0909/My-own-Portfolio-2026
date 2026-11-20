import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads, users } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { leadCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "").trim();
  const source = (url.searchParams.get("source") || "").trim();

  const db = await getDb();
  const [rows, allUsers] = await Promise.all([
    db.select().from(leads).orderBy(desc(leads.createdAt)),
    db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor }).from(users),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const filtered = rows
    .filter((l) => {
      if (status && status !== "all" && l.status !== status) return false;
      if (source && source !== "all" && l.source !== source) return false;
      if (q) {
        const hay = `${l.name} ${l.email} ${l.companyName} ${l.source} ${l.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((l) => {
      const owner = l.ownerId ? userMap.get(l.ownerId) : null;
      return {
        ...l,
        ownerName: owner?.name ?? "Unassigned",
        ownerColor: owner?.avatarColor ?? "#64748b",
      };
    });

  return NextResponse.json({ leads: filtered, team: allUsers });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await request.json().catch(() => null);
  const parsed = leadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid lead data" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();

  const [created] = await db
    .insert(leads)
    .values({
      name: data.name,
      email: data.email,
      phone: data.phone,
      companyName: data.companyName,
      source: data.source,
      status: data.status,
      score: data.score,
      estimatedValue: data.estimatedValue,
      ownerId: data.ownerId ?? auth.user.id,
      followUpAt: data.followUpAt ? new Date(data.followUpAt) : null,
      notes: data.notes,
    })
    .returning();

  return NextResponse.json({ lead: created }, { status: 201 });
}

