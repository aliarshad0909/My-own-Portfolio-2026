import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { employees, sessions, users } from "@/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
  generateSessionToken,
  hashSessionToken,
  type UserRole,
} from "@/lib/crypto";

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarColor: string;
  employeeId: string | null;
};

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(sessions).values({
    tokenHash,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = await getDb();
  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarColor: users.avatarColor,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  const linkedEmp = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, user.email))
    .limit(1);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    avatarColor: user.avatarColor,
    employeeId: linkedEmp[0]?.id ?? null,
  };
}

export async function requireApiUser(): Promise<{ user: SafeUser } | { error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required. Sign in to the PeopleOS workspace first." },
        { status: 401 },
      ),
    };
  }
  return { user };
}

export function canApproveLeave(role: string): boolean {
  return role === "admin" || role === "manager" || role === "demo";
}

export function canManageDirectory(role: string): boolean {
  return role === "admin" || role === "demo";
}
