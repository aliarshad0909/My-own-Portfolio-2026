import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { activityLogs, employeeDocuments, employees } from "@/db/schema";
import { canApproveLeave, requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { createDocumentSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db
    .select({
      id: employeeDocuments.id,
      employeeId: employeeDocuments.employeeId,
      employeeName: employees.fullName,
      employeeCode: employees.employeeCode,
      title: employeeDocuments.title,
      docType: employeeDocuments.docType,
      status: employeeDocuments.status,
      uploadedDate: employeeDocuments.uploadedDate,
      createdAt: employeeDocuments.createdAt,
    })
    .from(employeeDocuments)
    .innerJoin(employees, eq(employeeDocuments.employeeId, employees.id))
    .orderBy(desc(employeeDocuments.uploadedDate), employees.fullName);

  return NextResponse.json({ documents: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canApproveLeave(auth.user.role)) {
    return NextResponse.json(
      { error: "Only Managers, HR Admins, or HR Demo roles can register employee compliance documents." },
      { status: 403 },
    );
  }

  const limit = checkRateLimit(clientKey(request, "documents-write"), 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid document record." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, parsed.data.employeeId))
    .limit(1);
  if (!emp) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const [created] = await db.insert(employeeDocuments).values(parsed.data).returning();

  await db.insert(activityLogs).values({
    actorName: auth.user.name,
    action: "document.registered",
    entityType: "employee_document",
    entityId: created.id,
    summary: `Registered ${created.docType} document "${created.title}" for ${emp.fullName}.`,
  });

  return NextResponse.json({ document: created }, { status: 201 });
}
