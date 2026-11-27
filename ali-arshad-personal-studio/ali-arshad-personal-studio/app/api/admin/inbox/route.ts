import { adminJson, isDemoModeEnabled, requireAdminApi } from "@/lib/admin/auth";
import {
  checkDatabaseStatus,
  listContactInquiries,
  listStudioApplications,
  recordAdminAudit,
  updateContactInquiryStatus,
  updateStudioApplicationModeration,
} from "@/lib/admin/db";
import { listRecentGmailMessages } from "@/lib/admin/adapters/gmail";
import { DEMO_APPLICATIONS, DEMO_GMAIL_MESSAGES, DEMO_INQUIRIES } from "@/lib/admin/demo-data";
import type { ApplicationModerationStatus, InquiryStatus } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_INQUIRY_STATUSES: InquiryStatus[] = ["new", "reviewing", "replied", "archived"];
const ALLOWED_MODERATION_STATUSES: ApplicationModerationStatus[] = [
  "private_pending",
  "verified_private",
  "approved_public",
  "rejected",
  "archived",
];

export async function GET(request: Request) {
  const auth = requireAdminApi(request);
  if (!auth.ok) return auth.response;

  const demoMode = isDemoModeEnabled();
  const [dbStatus, liveInquiries, liveApps, gmailRes] = await Promise.all([
    checkDatabaseStatus(),
    listContactInquiries(false).catch(() => []),
    listStudioApplications(false).catch(() => []),
    listRecentGmailMessages(10),
  ]);

  const inquiries = liveInquiries.length > 0 ? liveInquiries : demoMode ? DEMO_INQUIRIES : [];
  const applications = liveApps.length > 0 ? liveApps : demoMode ? DEMO_APPLICATIONS : [];
  const gmail = gmailRes.ok
    ? {
        state: "connected" as const,
        accountEmail: gmailRes.accountEmail,
        detail: `Showing latest ${gmailRes.messages.length} inbox message headers from ${gmailRes.accountEmail}.`,
        messages: gmailRes.messages,
        isDemo: false,
      }
    : {
        state: gmailRes.state,
        accountEmail: null,
        detail: gmailRes.detail,
        messages: demoMode ? DEMO_GMAIL_MESSAGES : [],
        isDemo: demoMode,
      };

  return adminJson({
    ok: true,
    demoMode,
    database: dbStatus,
    inquiries,
    inquiriesAreDemo: inquiries.some((i) => i.isDemo),
    applications,
    applicationsAreDemo: applications.some((a) => a.isDemo),
    gmail,
  });
}

export async function PATCH(request: Request) {
  const auth = requireAdminApi(request, { requireCsrf: true });
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return adminJson({ ok: false, code: "bad_request", message: "Invalid JSON payload." }, 400);
  }

  const kind = typeof body.kind === "string" ? body.kind : "";
  const id = typeof body.id === "string" ? body.id.trim().slice(0, 64) : "";
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : undefined;

  if (!id || id.startsWith("demo_")) {
    return adminJson(
      {
        ok: false,
        code: "demo_record",
        message: "Synthetic demo items are read-only. Connect Neon PostgreSQL to update real submissions.",
      },
      400,
    );
  }

  if (kind === "inquiry") {
    const status = typeof body.status === "string" ? (body.status as InquiryStatus) : "new";
    if (!ALLOWED_INQUIRY_STATUSES.includes(status)) {
      return adminJson({ ok: false, code: "invalid", message: "Unsupported inquiry status." }, 422);
    }
    const updated = await updateContactInquiryStatus(id, status, notes);
    if (!updated) {
      return adminJson({ ok: false, code: "not_found", message: "Inquiry not found or database not configured." }, 404);
    }
    await recordAdminAudit(auth.session.sub, "inbox.inquiry.update", `${id}:${status}`, "ok");
    return adminJson({ ok: true, id, status });
  }

  if (kind === "application") {
    const moderationStatus =
      typeof body.moderationStatus === "string"
        ? (body.moderationStatus as ApplicationModerationStatus)
        : "private_pending";
    if (!ALLOWED_MODERATION_STATUSES.includes(moderationStatus)) {
      return adminJson({ ok: false, code: "invalid", message: "Unsupported moderation status." }, 422);
    }
    const updated = await updateStudioApplicationModeration(id, moderationStatus, notes);
    if (!updated) {
      return adminJson({ ok: false, code: "not_found", message: "Application not found or database not configured." }, 404);
    }
    await recordAdminAudit(auth.session.sub, "inbox.application.moderate", `${id}:${moderationStatus}`, "ok");
    return adminJson({ ok: true, id, moderationStatus });
  }

  return adminJson({ ok: false, code: "bad_request", message: "Specify kind='inquiry' or kind='application'." }, 400);
}
