import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { DEMO_ACCOUNT, verifyPassword } from "@/lib/crypto";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const limit = checkRateLimit(clientKey(request, "login"), 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide valid sign-in credentials." }, { status: 400 });
  }

  const db = await getDb();

  if ("demo" in parsed.data) {
    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);

    if (!demoUser) {
      return NextResponse.json({ error: "Demo HR account is not provisioned." }, { status: 500 });
    }

    await createSession(demoUser.id);
    return NextResponse.json({
      ok: true,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        avatarColor: demoUser.avatarColor,
      },
    });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid work email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    },
  });
}
