import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { companies, contacts, users } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { contactCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "").trim();
  const category = (url.searchParams.get("category") || "").trim();

  const db = await getDb();
  const [rows, allUsers, allCompanies] = await Promise.all([
    db.select().from(contacts).orderBy(desc(contacts.createdAt)),
    db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor }).from(users),
    db.select().from(companies),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const companyMap = new Map(allCompanies.map((c) => [c.id, c]));

  const filtered = rows
    .filter((c) => {
      if (status && status !== "all" && c.status !== status) return false;
      if (category && category !== "all" && c.category !== category) return false;
      if (q) {
        const hay = `${c.firstName} ${c.lastName} ${c.email} ${c.companyName} ${c.title} ${c.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((c) => {
      const owner = c.ownerId ? userMap.get(c.ownerId) : null;
      const company = c.companyId ? companyMap.get(c.companyId) : null;
      return {
        ...c,
        ownerName: owner?.name ?? "Unassigned",
        ownerColor: owner?.avatarColor ?? "#64748b",
        companyIndustry: company?.industry ?? "",
        companyLocation: company?.location ?? "",
        companyWebsite: company?.website ?? "",
      };
    });

  return NextResponse.json({ contacts: filtered, team: allUsers });
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "write"), 90, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded. Slow down and retry." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contactCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid contact data" }, { status: 400 });
  }

  const db = await getDb();
  const data = parsed.data;

  // Link or create company record when companyName is supplied
  let companyId = data.companyId ?? null;
  if (!companyId && data.companyName) {
    const existing = await db.select().from(companies).where(eq(companies.name, data.companyName)).limit(1);
    if (existing[0]) {
      companyId = existing[0].id;
    } else {
      const [createdCompany] = await db.insert(companies).values({ name: data.companyName }).returning();
      companyId = createdCompany.id;
    }
  }

  const [created] = await db
    .insert(contacts)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      title: data.title,
      companyId,
      companyName: data.companyName,
      status: data.status,
      category: data.category,
      ownerId: data.ownerId ?? auth.user.id,
      notes: data.notes,
    })
    .returning();

  return NextResponse.json({ contact: created }, { status: 201 });
}

