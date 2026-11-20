import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { DEMO_ACCOUNT, verifyPassword } from "@/lib/crypto";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request, "login"), 25, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { demo?: boolean; email?: string; password?: string };
    const db = await getDb();

    // Controlled one-click demo access
    if (body.demo === true) {
      const [demoUser] = await db.select().from(users).where(eq(users.email, DEMO_ACCOUNT.email)).limit(1);
      if (!demoUser) {
        return NextResponse.json({ error: "Demo workspace account not initialized." }, { status: 500 });
      }
      await createSession(demoUser.id);
      return NextResponse.json({
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          avatarColor: demoUser.avatarColor,
        },
      });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid credentials" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarColor: user.avatarColor,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to sign in right now." },
      { status: 500 },
    );
  }
}

