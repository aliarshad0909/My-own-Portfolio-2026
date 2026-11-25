/**
 * Server-only delivery for Studio Network collaborator registrations (`/api/studio-network`).
 * Shares the Resend / Webhook environment configuration (with optional STUDIO_NETWORK_* overrides)
 * and labels every email distinctly from client Contact inquiries.
 * Never import this file from client components.
 */
import { buildLabeledEmailHtml, envVar, sendResendEmail } from "@/lib/form-security";
import { findCoarseRegion, type CollaboratorInput } from "@/lib/studio-network";

export function networkDeliveryChannels() {
  const webhookUrl = envVar("STUDIO_NETWORK_WEBHOOK_URL") || envVar("INQUIRY_WEBHOOK_URL");
  const toEmail = envVar("STUDIO_NETWORK_TO_EMAIL") || envVar("INQUIRY_TO_EMAIL");
  const fromEmail = envVar("STUDIO_NETWORK_FROM_EMAIL") || envVar("INQUIRY_FROM_EMAIL");
  return {
    webhook: webhookUrl !== "",
    email: envVar("RESEND_API_KEY") !== "" && toEmail !== "" && fromEmail !== "",
  };
}

export function isNetworkDeliveryConfigured(): boolean {
  const c = networkDeliveryChannels();
  return c.webhook || c.email;
}

async function sendWebhook(application: CollaboratorInput, meta: { receivedAt: string; visibility: string }) {
  const url = envVar("STUDIO_NETWORK_WEBHOOK_URL") || envVar("INQUIRY_WEBHOOK_URL");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = envVar("STUDIO_NETWORK_WEBHOOK_SECRET") || envVar("INQUIRY_WEBHOOK_SECRET");
  if (secret) headers["x-inquiry-secret"] = secret;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "ali-arshad-studio-network",
      formType: "studio_network_application",
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
  const toEmail = envVar("STUDIO_NETWORK_TO_EMAIL") || envVar("INQUIRY_TO_EMAIL");
  const fromEmail = envVar("STUDIO_NETWORK_FROM_EMAIL") || envVar("INQUIRY_FROM_EMAIL");
  const regionLabel = findCoarseRegion(application.approximateRegion)?.label ?? "Private (not opted into public globe)";

  const rows = [
    { label: "Form Source", value: "Studio Network Registration (/studio-network)" },
    { label: "Full Name", value: application.name },
    { label: "Email", value: application.email, href: `mailto:${application.email}` },
    { label: "Location / Time Zone", value: application.locationTimezone },
    { label: "Primary Skills", value: application.skills.join(", ") },
    { label: "Portfolio / Work Samples", value: application.portfolioUrl, href: application.portfolioUrl },
    { label: "Availability", value: application.availability },
    {
      label: "Public Globe Opt-In",
      value: application.publicListingOptIn
        ? "Requested (requires manual verification & moderation approval)"
        : "No — Private internal roster only",
    },
    { label: "Coarse Globe Region", value: regionLabel },
    { label: "Publication State", value: meta.visibility },
    { label: "Received (UTC)", value: meta.receivedAt },
  ];

  const html = buildLabeledEmailHtml({
    badge: "Studio Network Application",
    heading: `New Studio Network collaborator: ${application.name}`,
    introNote:
      "Submitted via the Studio Network registration form (/studio-network). Kept strictly private by default until manually verified and approved.",
    rows,
    messageHeading: "Collaborator Introduction",
    messageBody: application.introduction,
  });

  const text =
    "=== STUDIO NETWORK COLLABORATOR APPLICATION ===\n" +
    rows.map((r) => `${r.label}: ${r.value}`).join("\n") +
    `\n\n--- Collaborator Introduction ---\n${application.introduction}`;

  await sendResendEmail({
    apiKey: envVar("RESEND_API_KEY"),
    from: fromEmail,
    to: [toEmail],
    replyTo: application.email,
    subject: `[Studio Network Application] ${application.skills[0] ?? "Specialist"} — ${application.name}`,
    html,
    text,
    formTag: "studio_network_application",
    formHeader: "studio-network-application",
  });
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
