import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { contacts, dealHistory, deals, users } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { stageProbability } from "@/lib/constants";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { dealCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const stage = (url.searchParams.get("stage") || "").trim();
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const db = await getDb();
  const [rows, allUsers, allContacts] = await Promise.all([
    db.select().from(deals).orderBy(desc(deals.updatedAt)),
    db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor }).from(users),
    db.select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName, companyName: contacts.companyName }).from(contacts),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const contactMap = new Map(allContacts.map((c) => [c.id, c]));

  const filtered = rows
    .filter((d) => {
      if (stage && stage !== "all" && d.stage !== stage) return false;
      if (q) {
        const hay = `${d.title} ${d.companyName} ${d.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((d) => {
      const owner = d.ownerId ? userMap.get(d.ownerId) : null;
      const contact = d.contactId ? contactMap.get(d.contactId) : null;
      return {
        ...d,
        ownerName: owner?.name ?? "Unassigned",
        ownerColor: owner?.avatarColor ?? "#64748b",
        contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
      };
    });

  return NextResponse.json({ deals: filtered, team: allUsers, contacts: allContacts });
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
  const parsed = dealCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid deal data" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();

  const created = await db.transaction(async (tx) => {
    const isClosed = data.stage === "won" || data.stage === "lost";
    const [deal] = await tx
      .insert(deals)
      .values({
        title: data.title,
        value: data.value,
        stage: data.stage,
        probability: data.probability ?? stageProbability(data.stage),
        expectedCloseDate: data.expectedCloseDate,
        contactId: data.contactId ?? null,
        companyName: data.companyName,
        ownerId: data.ownerId ?? auth.user.id,
        notes: data.notes,
        closedAt: isClosed ? new Date() : null,
      })
      .returning();

    await tx.insert(dealHistory).values({
      dealId: deal.id,
      fromStage: null,
      toStage: deal.stage,
      changedBy: auth.user.name,
      note: "Opportunity created",
    });

    return deal;
  });

  return NextResponse.json({ deal: created }, { status: 201 });
}

