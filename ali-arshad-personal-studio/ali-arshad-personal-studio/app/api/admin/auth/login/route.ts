import {
  adminJson,
  createSessionToken,
  isAdminAuthConfigured,
  isDemoModeEnabled,
  sessionCookieOptions,
  verifyAdminCredentials,
} from "@/lib/admin/auth";
import { recordAdminAudit } from "@/lib/admin/db";
import { adminRateLimit } from "@/lib/admin/rate-limit";
import { extractClientIp, isSameOrigin } from "@/lib/form-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return adminJson({ ok: false, code: "forbidden", message: "Cross-origin login request rejected." }, 403);
  }
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return adminJson({ ok: false, code: "bad_request", message: "Expected JSON login payload." }, 415);
  }
  if (!isAdminAuthConfigured()) {
    return adminJson(
      {
        ok: false,
        code: "auth_not_configured",
        message:
          "Admin credentials are not configured on this server yet. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH, and ADMIN_SESSION_SECRET.",
      },
      503,
    );
  }

  const clientIp = extractClientIp(request);
  const limited = await adminRateLimit(`admin-login:${clientIp}`, 5, 15 * 60);
  if (!limited.allowed) {
    return adminJson(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many sign-in attempts from this connection. Please wait before trying again.",
      },
      429,
      { "Retry-After": String(limited.retryAfter) },
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return adminJson({ ok: false, code: "bad_request", message: "Invalid JSON payload." }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 160) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";

  if (!email || !password) {
    return adminJson({ ok: false, code: "invalid", message: "Enter both email and password." }, 400);
  }

  const valid = verifyAdminCredentials(email, password);
  if (!valid) {
    await recordAdminAudit(email || "unknown", "admin.login.failed", clientIp, "error");
    return adminJson({ ok: false, code: "invalid_credentials", message: "Invalid email or password." }, 401);
  }

  const { token, payload } = createSessionToken(email);
  await recordAdminAudit(payload.sub, "admin.login.success", clientIp, "ok");

  const res = adminJson({
    ok: true,
    session: {
      email: payload.sub,
      csrfToken: payload.csrf,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      demoMode: isDemoModeEnabled(),
    },
  });
  res.cookies.set({ ...sessionCookieOptions(request), value: token });
  return res;
}
