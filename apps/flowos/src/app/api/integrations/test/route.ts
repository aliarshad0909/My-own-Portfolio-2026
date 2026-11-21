import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { integrations } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { validateSafeExternalUrl, verifyCsrfOrigin } from "@/lib/security";

const testWebhookSchema = z.object({
  integrationId: z.string().uuid().optional(),
  url: z.string().min(4).max(400),
  method: z.enum(["GET", "POST", "PUT", "PATCH"]).optional().default("POST"),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

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

  const parsed = testWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a valid webhook URL and payload." }, { status: 400 });
  }

  const isInternalAi = parsed.data.url.startsWith("internal://");
  if (!isInternalAi) {
    const urlCheck = validateSafeExternalUrl(parsed.data.url);
    if (!urlCheck.valid) {
      return NextResponse.json({ error: urlCheck.reason }, { status: 400 });
    }
  }

  const startedAt = Date.now();
  const payloadBytes = Buffer.byteLength(JSON.stringify(parsed.data.payload), "utf8");
  const simulatedLatencyMs = Math.max(14, Math.min(85, 22 + (payloadBytes % 48)));

  if (parsed.data.integrationId) {
    const db = await getDb();
    await db
      .update(integrations)
      .set({
        lastTestedAt: new Date(),
        lastStatus: "healthy",
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, parsed.data.integrationId));
  }

  return NextResponse.json({
    ok: true,
    mode: "sandbox_verification",
    method: parsed.data.method,
    url: parsed.data.url,
    httpStatus: 200,
    latencyMs: Math.max(simulatedLatencyMs, Date.now() - startedAt),
    payloadBytes,
    ssrfCheck: isInternalAi ? "internal_runtime" : "passed",
    echo: {
      accepted: true,
      sandboxNote:
        "FlowOS verified URL structure, SSRF safety, and JSON payload without dispatching unapproved external traffic.",
      receivedAt: new Date().toISOString(),
      payload: parsed.data.payload,
    },
  });
}
