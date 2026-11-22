import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { integrations } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { validateSafeExternalUrl, verifyCsrfOrigin } from "@/lib/security";

const patchIntegrationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  endpointUrl: z.string().max(400).optional(),
  enabled: z.boolean().optional(),
  description: z.string().max(400).optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchIntegrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid integration update." }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db.select().from(integrations).where(eq(integrations.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Integration not found." }, { status: 404 });
  }

  if (
    existing.kind !== "ai_deterministic" &&
    parsed.data.endpointUrl !== undefined &&
    parsed.data.endpointUrl.trim() !== ""
  ) {
    const check = validateSafeExternalUrl(parsed.data.endpointUrl);
    if (!check.valid) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
  }

  const updateData: Partial<typeof integrations.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.endpointUrl !== undefined) updateData.endpointUrl = parsed.data.endpointUrl.trim();
  if (parsed.data.enabled !== undefined) updateData.enabled = parsed.data.enabled;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.configJson !== undefined) updateData.configJson = parsed.data.configJson;

  const [updated] = await db
    .update(integrations)
    .set(updateData)
    .where(eq(integrations.id, id))
    .returning();

  return NextResponse.json({ integration: updated });
}
