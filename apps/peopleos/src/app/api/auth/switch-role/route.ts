import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { requireApiUser } from "@/lib/auth";
import { DEMO_PERSONAS, SESSION_COOKIE_NAME, hashSessionToken } from "@/lib/crypto";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { switchRoleSchema } from "@/lib/validators";

/**
 * Controlled Demo RBAC Role-View Switcher.
 * Re-binds the authenticated server session to one of the four seeded personas
 * (demo | admin | manager | employee) so visitors can verify real server-side
 * PII redaction and approval permissions without client-side spoofing.
 */
export async function POST(request: Request) {
  if (process.env.ALLOW_DEMO_RESET === "false") {
    return NextResponse.json({ error: "Demo role switching is disabled in this environment." }, { status: 403 });
  }

  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "switch-role"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Role switching rate-limited. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = switchRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
  }

  const targetPersona = DEMO_PERSONAS[parsed.data.role];
  const db = await getDb();
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, targetPersona.email))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "Seeded persona account not found." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Session missing." }, { status: 401 });
  }

  await db
    .update(sessions)
    .set({ userId: targetUser.id })
    .where(eq(sessions.tokenHash, hashSessionToken(token)));

  return NextResponse.json({
    ok: true,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      avatarColor: targetUser.avatarColor,
    },
  });
}
