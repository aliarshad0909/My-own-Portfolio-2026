import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { integrations } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { validateSafeExternalUrl, verifyCsrfOrigin } from "@/lib/security";

const createIntegrationSchema = z.object({
  name: z.string().min(2).max(100),
  kind: z.enum(["webhook", "n8n", "http", "ai_deterministic"]),
  endpointUrl: z.string().max(400).optional().default(""),
  enabled: z.boolean().optional().default(true),
  description: z.string().max(400).optional().default(""),
  configJson: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const db = await getDb();
  const rows = await db.select().from(integrations).orderBy(asc(integrations.createdAt));
  return NextResponse.json({
    integrations: rows,
    aiRuntime: {
      defaultMode: "deterministic",
      liveLlmConfigured: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL || "deterministic-engine-v1",
    },
  });
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
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createIntegrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid integration settings." }, { status: 400 });
  }

  if (parsed.data.kind !== "ai_deterministic" && parsed.data.endpointUrl.trim()) {
    const check = validateSafeExternalUrl(parsed.data.endpointUrl);
    if (!check.valid) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }
  }

  const db = await getDb();
  const [created] = await db
    .insert(integrations)
    .values({
      name: parsed.data.name,
      kind: parsed.data.kind,
      endpointUrl: parsed.data.endpointUrl.trim(),
      enabled: parsed.data.enabled,
      description: parsed.data.description,
      configJson: parsed.data.configJson,
      lastStatus: "configured",
    })
    .returning();

  return NextResponse.json({ integration: created }, { status: 201 });
}
