import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
  generateSessionToken,
  hashSessionToken,
} from "@/lib/crypto";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export async function createSession(
  userId: string,
  clientType: "web" | "mobile" = "web",
): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(sessions).values({
    tokenHash,
    userId,
    clientType,
    expiresAt,
  });

  if (clientType === "web") {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
  }

  return { token, expiresAt };
}

export async function destroySession(request?: Request): Promise<void> {
  const bearer = extractBearer(request);
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const token = bearer || cookieToken;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

function extractBearer(request?: Request): string | null {
  const header = request?.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    return token || null;
  }
  return null;
}

/**
 * Resolves the authenticated user from either:
 * 1. `Authorization: Bearer <token>` (StockFlow Expo Mobile App / API clients), OR
 * 2. HTTP-only session cookie (StockFlow Web Operations Dashboard).
 */
export async function getCurrentUser(request?: Request): Promise<SafeUser | null> {
  const bearer = extractBearer(request);
  const cookieToken = bearer ? null : (await cookies()).get(SESSION_COOKIE_NAME)?.value ?? null;
  const token = bearer || cookieToken;
  if (!token) return null;

  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

export async function requireApiUser(request: Request): Promise<{ user: SafeUser } | { error: NextResponse }> {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required. Sign in with demo credentials or Bearer token." },
        { status: 401 },
      ),
    };
  }
  return { user };
}

export function isAllowedOpsRole(role: string): boolean {
  return role === "admin" || role === "ops_manager" || role === "warehouse_staff" || role === "demo";
}

