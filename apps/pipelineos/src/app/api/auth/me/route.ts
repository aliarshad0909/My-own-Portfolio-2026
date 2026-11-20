import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const db = await getDb();
  const team = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, avatarColor: users.avatarColor })
    .from(users);
  return NextResponse.json({ user, team });
}

