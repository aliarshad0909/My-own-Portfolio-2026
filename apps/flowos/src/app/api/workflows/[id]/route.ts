import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workflows } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import type { FlowEdge, FlowNode } from "@/lib/types";

const patchWorkflowSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(600).optional(),
  category: z.string().max(60).optional(),
  triggerType: z.enum(["trigger", "schedule", "webhook"]).optional(),
  active: z.boolean().optional(),
  nodesJson: z.array(z.any()).optional(),
  edgesJson: z.array(z.any()).optional(),
  samplePayload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();
  const [wf] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  if (!wf) {
    return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  }
  return NextResponse.json({ workflow: wf });
}

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
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = patchWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow update payload.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  }

  const updateValues: Partial<typeof workflows.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (parsed.data.name !== undefined) updateValues.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateValues.description = parsed.data.description;
  if (parsed.data.category !== undefined) updateValues.category = parsed.data.category;
  if (parsed.data.triggerType !== undefined) updateValues.triggerType = parsed.data.triggerType;
  if (parsed.data.active !== undefined) updateValues.active = parsed.data.active;
  if (parsed.data.nodesJson !== undefined) updateValues.nodesJson = parsed.data.nodesJson as FlowNode[];
  if (parsed.data.edgesJson !== undefined) updateValues.edgesJson = parsed.data.edgesJson as FlowEdge[];
  if (parsed.data.samplePayload !== undefined) updateValues.samplePayload = parsed.data.samplePayload;

  const [updated] = await db
    .update(workflows)
    .set(updateValues)
    .where(eq(workflows.id, id))
    .returning();

  return NextResponse.json({ workflow: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const db = await getDb();
  const [existing] = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  }
  if (existing.isTemplate) {
    return NextResponse.json({ error: "Built-in templates cannot be deleted." }, { status: 400 });
  }

  await db.delete(workflows).where(eq(workflows.id, id));
  return NextResponse.json({ ok: true });
}
