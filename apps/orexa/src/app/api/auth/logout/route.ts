import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { verifyCsrfOrigin } from "@/lib/security";

export async function POST(request: Request) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  await destroySession();
  return NextResponse.json({ ok: true });
}
