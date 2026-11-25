/**
 * Server-only delivery for Studio Network collaborator registrations.
 * Reuses the studio's Resend / Webhook delivery configuration so no extra paid
 * service is required. Never import from client components.
 */
import { findCoarseRegion, type CollaboratorInput } from "@/lib/studio-network";

const env = (k: string) => (process.env[k] ?? "").trim();

export function networkDeliveryChannels() {
  const webhookUrl = env("STUDIO_NETWORK_WEBHOOK_URL") || env("INQUIRY_WEBHOOK_URL");
  const toEmail = env("STUDIO_NETWORK_TO_EMAIL") || env("INQUIRY_TO_EMAIL");
  const fromEmail = env("INQUIRY_FROM_EMAIL");
  return {
    webhook: webhookUrl !== "",
    email: env("RESEND_API_KEY") !== "" && toEmail !== "" && fromEmail !== "",
  };
}

export function isNetworkDeliveryConfigured(): boolean {
  const c = networkDeliveryChannels();
  return c.webhook || c.email;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function sendWebhook(application: CollaboratorInput, meta: { receivedAt: string; visibility: string }) {
  const url = env("STUDIO_NETWORK_WEBHOOK_URL") || env("INQUIRY_WEBHOOK_URL");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = env("STUDIO_NETWORK_WEBHOOK_SECRET") || env("INQUIRY_WEBHOOK_SECRET");
  if (secret) headers["x-inquiry-secret"] = secret;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "ali-arshad-studio-network",
      moderationStatus: "pending",
      publishedToGlobe: false,
      ...meta,
      application,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
}

async function sendEmail(application: CollaboratorInput, meta: { receivedAt: string; visibility: string }) {
  const toEmail = env("STUDIO_NETWORK_TO_EMAIL") || env("INQUIRY_TO_EMAIL");
  const regionLabel = findCoarseRegion(application.approximateRegion)?.label ?? "Private (not opted into public globe)";
  const rows: [string, string][] = [
    ["Name", application.name],
    ["Email", application.email],
    ["Location / Time Zone", application.locationTimezone],
    ["Primary Skills", application.skills.join(", ")],
    ["Portfolio / Samples", application.portfolioUrl],
    ["Availability", application.availability],
    ["Public Globe Opt-In", application.publicListingOptIn ? "Requested (requires verification & approval)" : "No — Private only"],
    ["Coarse Globe Region", regionLabel],
    ["Default Publication State", meta.visibility],
    ["Received", meta.receivedAt],
  ];

  const html =
    `<h2>New Studio Network collaborator registration</h2><table cellpadding="6">` +
    rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join("") +
    `</table><h3>Introduction</h3><p style="white-space:pre-wrap">${escapeHtml(application.introduction)}</p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${application.introduction}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("INQUIRY_FROM_EMAIL"),
      to: [toEmail],
      reply_to: application.email,
      subject: `Studio Network collaborator: ${application.name} (${application.skills[0] ?? "Specialist"})`,
      html,
      text,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Email provider responded with ${res.status}`);
}

export async function deliverCollaboratorApplication(
  application: CollaboratorInput,
): Promise<{ delivered: boolean; failures: string[] }> {
  const channels = networkDeliveryChannels();
  const meta = {
    receivedAt: new Date().toISOString(),
    visibility: "Private by default — never auto-published to public globe",
  };
  const tasks: Promise<void>[] = [];
  if (channels.webhook) tasks.push(sendWebhook(application, meta));
  if (channels.email) tasks.push(sendEmail(application, meta));

  const results = await Promise.allSettled(tasks);
  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
  return { delivered: results.some((r) => r.status === "fulfilled"), failures };
}
