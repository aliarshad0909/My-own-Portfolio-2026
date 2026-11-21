import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { computeSlaStatus } from "@/lib/support-engine";
import { postTicketMessage } from "@/lib/ticket-service";
import { createMessageSchema } from "@/lib/validation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "tickets:message"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const { id } = await context.params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid ticket ID." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message payload." },
      { status: 400 },
    );
  }

  const db = await getDb();
  const result = await postTicketMessage(db, {
    ticketId: id,
    body: parsed.data.body,
    isInternalNote: parsed.data.isInternalNote,
    authorRole: parsed.data.authorRole,
    authorName: parsed.data.authorName || auth.user.name,
    nextStatus: parsed.data.nextStatus,
  });

  if (!result) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      message: result.message,
      ticket: {
        ...result.ticket,
        sla: computeSlaStatus(result.ticket),
      },
    },
    { status: 201 },
  );
}
