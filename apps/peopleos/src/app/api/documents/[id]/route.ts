import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, employeeDocuments } from "@/db/schema";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import { updateDocumentSchema } from "@/lib/validators";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      { error: "Only Managers, HR Admins, or HR Demo roles can update compliance document status." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(employeeDocuments)
    .set({ status: parsed.data.status })
    .where(eq(employeeDocuments.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "document.updated",
    entityType: "employee_document",
    entityId: updated.id,
    summary: `Updated "${updated.title}" compliance status to ${updated.status}.`,
  });

  return NextResponse.json({ document: updated });
}
