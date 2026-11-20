import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activities, contacts, dealHistory, deals, leads } from "@/db/schema";
import { isAllowedWorkspaceRole, requireApiUser } from "@/lib/auth";
import { stageProbability } from "@/lib/constants";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { leadConvertSchema } from "@/lib/validation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Converts a lead into a Contact + active Pipeline Deal + initial Deal History + Activity
 * atomically inside a PostgreSQL transaction.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!isAllowedWorkspaceRole(auth.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const limit = checkRateLimit(clientKey(request, "write"), 60, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { id } = await context.params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = leadConvertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid conversion payload" }, { status: 400 });
  }

  const db = await getDb();
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (lead.status === "converted" && lead.convertedDealId) {
    return NextResponse.json({ error: "This lead has already been converted to an opportunity." }, { status: 409 });
  }

  const nameParts = lead.name.trim().split(/\s+/);
  const firstName = nameParts[0] || lead.name;
  const lastName = nameParts.slice(1).join(" ") || "Contact";

  const result = await db.transaction(async (tx) => {
    const [existingContact] = await tx.select().from(contacts).where(eq(contacts.email, lead.email)).limit(1);
    const contact =
      existingContact ??
      (
        await tx
          .insert(contacts)
          .values({
            firstName,
            lastName,
            email: lead.email,
            phone: lead.phone,
            companyName: lead.companyName,
            status: "active",
            category: "decision_maker",
            ownerId: lead.ownerId ?? auth.user.id,
            notes: lead.notes,
          })
          .returning()
      )[0];

    const dealTitle = parsed.data.dealTitle || `${lead.companyName || lead.name} Opportunity`;
    const dealValue = parsed.data.value ?? lead.estimatedValue;
    const stage = parsed.data.stage;

    const [deal] = await tx
      .insert(deals)
      .values({
        title: dealTitle,
        value: dealValue,
        stage,
        probability: stageProbability(stage),
        expectedCloseDate:
          parsed.data.expectedCloseDate || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
        contactId: contact.id,
        companyName: lead.companyName || `${firstName} ${lastName}`,
        ownerId: lead.ownerId ?? auth.user.id,
        notes: lead.notes,
      })
      .returning();

    await tx.insert(dealHistory).values({
      dealId: deal.id,
      fromStage: null,
      toStage: stage,
      changedBy: auth.user.name,
      note: `Converted from lead "${lead.name}" (${lead.source})`,
    });

    await tx.insert(activities).values({
      type: "follow_up",
      title: `Follow up on newly converted deal: ${deal.title}`,
      description: `Lead "${lead.name}" qualified and converted into pipeline stage "${stage}".`,
      status: "pending",
      dueAt: new Date(Date.now() + 2 * 86_400_000),
      contactId: contact.id,
      leadId: lead.id,
      dealId: deal.id,
      ownerId: lead.ownerId ?? auth.user.id,
    });

    const [updatedLead] = await tx
      .update(leads)
      .set({
        status: "converted",
        convertedDealId: deal.id,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id))
      .returning();

    return { lead: updatedLead, contact, deal };
  });

  return NextResponse.json(result, { status: 201 });
}

