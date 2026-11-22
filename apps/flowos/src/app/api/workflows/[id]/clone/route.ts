import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { workflows } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();
  const [source] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  if (!source) {
    return NextResponse.json({ error: "Template or workflow not found." }, { status: 404 });
  }

  let customName: string | undefined;
  try {
    const body = (await request.json()) as { name?: string };
    if (body?.name && typeof body.name === "string" && body.name.trim().length >= 2) {
      customName = body.name.trim().slice(0, 120);
    }
  } catch {
    // Optional body
  }

  const clonedName = customName || `${source.name} (Copy)`;
  const slug =
    clonedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36).slice(-4);

  const [cloned] = await db
    .insert(workflows)
    .values({
      slug,
      name: clonedName,
      description: source.description,
      category: source.category,
      triggerType: source.triggerType,
      active: true,
      isTemplate: false,
      nodesJson: source.nodesJson,
      edgesJson: source.edgesJson,
      samplePayload: source.samplePayload,
      createdBy: auth.user.id,
    })
    .returning();

  return NextResponse.json({ workflow: cloned }, { status: 201 });
}
