import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { DEMO_ACCOUNT, verifyPassword } from "@/lib/crypto";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request, "login"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      demo?: boolean;
      email?: string;
      password?: string;
      clientType?: "web" | "mobile";
    };
    const clientType = body.clientType === "mobile" ? "mobile" : "web";
    const db = await getDb();

    if (body.demo === true) {
      const [demoUser] = await db.select().from(users).where(eq(users.email, DEMO_ACCOUNT.email)).limit(1);
      if (!demoUser) {
        return NextResponse.json({ error: "Demo account not initialized." }, { status: 500 });
      }
      const { token, expiresAt } = await createSession(demoUser.id, clientType);
      return NextResponse.json({
        token,
        expiresAt: expiresAt.toISOString(),
        user: { id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role },
      });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid login data" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email.toLowerCase())).limit(1);
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id, parsed.data.clientType);
    return NextResponse.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to authenticate." },
      { status: 500 },
    );
  }
}

