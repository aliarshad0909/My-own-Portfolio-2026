import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { teamMembers } from "@/db/schema";
import { recordActivity } from "@/lib/activity";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { createTeamMemberSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const members = await db.select().from(teamMembers).orderBy(asc(teamMembers.name));
  return NextResponse.json({ teamMembers: members });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = createTeamMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid team member." },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();
    const [created] = await db
      .insert(teamMembers)
      .values({
        name: parsed.data.name,
        roleTitle: parsed.data.roleTitle,
        email: parsed.data.email.toLowerCase(),
        capacityHours: parsed.data.capacityHours,
        avatarColor: parsed.data.avatarColor,
      })
      .returning();

    await recordActivity(db, {
      actorName: auth.user.name,
      action: "added_member",
      entityType: "team_member",
      entityTitle: `${created.name} (${created.roleTitle})`,
      projectId: null,
      detail: `${created.capacityHours}h weekly capacity`,
    });

    return NextResponse.json({ teamMember: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to add team member.";
    const status = msg.toLowerCase().includes("unique") ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? "A team member with this email already exists." : msg },
      { status },
    );
  }
}
