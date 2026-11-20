import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activities, contacts, deals, leads, users } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { activityCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "").trim();
  const type = (url.searchParams.get("type") || "").trim();
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();

  const db = await getDb();
  const [rows, allUsers, allContacts, allDeals, allLeads] = await Promise.all([
    db.select().from(activities).orderBy(desc(activities.createdAt)),
    db.select({ id: users.id, name: users.name, avatarColor: users.avatarColor }).from(users),
    db.select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName }).from(contacts),
    db.select({ id: deals.id, title: deals.title }).from(deals),
    db.select({ id: leads.id, name: leads.name }).from(leads),
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const contactMap = new Map(allContacts.map((c) => [c.id, c]));
  const dealMap = new Map(allDeals.map((d) => [d.id, d]));
  const leadMap = new Map(allLeads.map((l) => [l.id, l]));

  const filtered = rows
    .filter((a) => {
      if (status && status !== "all" && a.status !== status) return false;
      if (type && type !== "all" && a.type !== type) return false;
      if (q) {
        const hay = `${a.title} ${a.description} ${a.type}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((a) => {
      const owner = a.ownerId ? userMap.get(a.ownerId) : null;
      const contact = a.contactId ? contactMap.get(a.contactId) : null;
      const deal = a.dealId ? dealMap.get(a.dealId) : null;
      const lead = a.leadId ? leadMap.get(a.leadId) : null;
      return {
        ...a,
        ownerName: owner?.name ?? "Unassigned",
        contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
        dealTitle: deal?.title ?? null,
        leadName: lead?.name ?? null,
      };
    });

  return NextResponse.json({
    activities: filtered,
    team: allUsers,
    contacts: allContacts,
    deals: allDeals,
    leads: allLeads,
  });
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
  const parsed = activityCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid activity data" }, { status: 400 });
  }

  const data = parsed.data;
  const db = await getDb();

  const [created] = await db
    .insert(activities)
    .values({
      type: data.type,
      title: data.title,
      description: data.description,
      status: data.status,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      completedAt: data.status === "completed" ? new Date() : null,
      contactId: data.contactId ?? null,
      leadId: data.leadId ?? null,
      dealId: data.dealId ?? null,
      ownerId: data.ownerId ?? auth.user.id,
    })
    .returning();

  return NextResponse.json({ activity: created }, { status: 201 });
}

