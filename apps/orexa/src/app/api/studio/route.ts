import { NextResponse } from "next/server";
import { canAuthorStudio, requireApiUser } from "@/lib/auth";
import { getStudioData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;
  if (!canAuthorStudio(auth.user.role)) {
    return NextResponse.json({ error: "Instructor or admin permissions required." }, { status: 403 });
  }

  const data = await getStudioData(auth.user.id);
  return NextResponse.json(data);
}
