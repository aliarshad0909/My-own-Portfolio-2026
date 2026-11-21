import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { DEMO_ACCOUNT, verifyPassword } from "@/lib/crypto";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";

const loginSchema = z.object({
  mode: z.enum(["credentials", "demo"]).optional(),
  email: z.string().email().optional(),
  password: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const limit = checkRateLimit(clientKey(request, "login"), 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide valid sign-in credentials." }, { status: 400 });
  }

  const db = await getDb();

  if (parsed.data.mode === "demo") {
    const [demoUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);
    if (!demoUser) {
      return NextResponse.json({ error: "Demo account not initialized." }, { status: 500 });
    }
    await createSession(demoUser.id);
    return NextResponse.json({
      ok: true,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      },
    });
  }

  const email = (parsed.data.email || "").trim().toLowerCase();
  const password = parsed.data.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}
