import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { workflows } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";
import type { FlowEdge, FlowNode } from "@/lib/types";

const createWorkflowSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().default(""),
  category: z.string().max(60).optional().default("Operations"),
  triggerType: z.enum(["trigger", "schedule", "webhook"]).optional().default("trigger"),
  active: z.boolean().optional().default(true),
  nodesJson: z.array(z.any()).optional(),
  edgesJson: z.array(z.any()).optional(),
  samplePayload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const templatesOnly = searchParams.get("templates") === "true";
  const includeAll = searchParams.get("all") === "true";

  const db = await getDb();
  const rows = includeAll
    ? await db.select().from(workflows).orderBy(desc(workflows.updatedAt))
    : await db
        .select()
        .from(workflows)
        .where(eq(workflows.isTemplate, templatesOnly))
        .orderBy(desc(workflows.updatedAt));

  return NextResponse.json({ workflows: rows });
}

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = createWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow fields.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const defaultNodes: FlowNode[] = (parsed.data.nodesJson as FlowNode[] | undefined) || [
    {
      id: "node-trigger-1",
      type: "flowNode",
      position: { x: 80, y: 150 },
      data: {
        label: "Manual Trigger",
        nodeType: parsed.data.triggerType,
        description: "Workflow entry point",
        config: { eventName: "custom.event" },
      },
    },
    {
      id: "node-ai-2",
      type: "flowNode",
      position: { x: 380, y: 150 },
      data: {
        label: "AI Deterministic Process",
        nodeType: "ai_process",
        description: "Scores & drafts response deterministically",
        config: { task: "custom", systemPrompt: "Summarize payload and draft action." },
      },
    },
    {
      id: "node-approval-3",
      type: "flowNode",
      position: { x: 690, y: 150 },
      data: {
        label: "Human Approval Gate",
        nodeType: "human_approval",
        description: "Mandatory safety review before external dispatch",
        config: {
          approvalPrompt: "Approve AI draft before running downstream HTTP dispatch.",
          approverRole: "Operations Lead",
        },
      },
    },
    {
      id: "node-http-4",
      type: "flowNode",
      position: { x: 1000, y: 150 },
      data: {
        label: "Sandbox HTTP Dispatch",
        nodeType: "http_request",
        description: "Dry-run webhook delivery",
        config: {
          method: "POST",
          url: "https://hooks.flowos.studio/sandbox/custom",
          sandbox: true,
        },
      },
    },
  ];

  const defaultEdges: FlowEdge[] = (parsed.data.edgesJson as FlowEdge[] | undefined) || [
    { id: "e-1-2", source: "node-trigger-1", target: "node-ai-2", animated: true },
    { id: "e-2-3", source: "node-ai-2", target: "node-approval-3", animated: true },
    { id: "e-3-4", source: "node-approval-3", target: "node-http-4", animated: true },
  ];

  const slug =
    parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36).slice(-4);

  const db = await getDb();
  const [created] = await db
    .insert(workflows)
    .values({
      slug,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      triggerType: parsed.data.triggerType,
      active: parsed.data.active,
      isTemplate: false,
      nodesJson: defaultNodes,
      edgesJson: defaultEdges,
      samplePayload: parsed.data.samplePayload || {
        subject: "Sample event",
        priority: "high",
        amountUsd: 12000,
      },
      createdBy: auth.user.id,
    })
    .returning();

  return NextResponse.json({ workflow: created }, { status: 201 });
}
