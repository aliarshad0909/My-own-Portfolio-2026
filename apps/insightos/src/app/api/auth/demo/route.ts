import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { DEMO_ACCOUNT } from "@/lib/crypto";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const limit = checkRateLimit(clientKey(request, "auth-demo"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many demo login attempts. Retry in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const db = await getDb();
  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_ACCOUNT.email))
    .limit(1);

  if (!demoUser) {
    return NextResponse.json({ error: "Demo account is not initialized." }, { status: 500 });
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
