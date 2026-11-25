/**
 * Server-only delivery for Contact / Project Inquiry submissions (`/api/inquiry`).
 * Reads secrets strictly from server environment variables — never import from client code.
 */
import { buildLabeledEmailHtml, envVar, sendResendEmail } from "@/lib/form-security";
import type { InquiryInput } from "@/lib/inquiry";

export function deliveryChannels() {
  return {
    webhook: envVar("INQUIRY_WEBHOOK_URL") !== "",
    email:
      envVar("RESEND_API_KEY") !== "" &&
      envVar("INQUIRY_TO_EMAIL") !== "" &&
      envVar("INQUIRY_FROM_EMAIL") !== "",
  };
}

export function isDeliveryConfigured(): boolean {
  const c = deliveryChannels();
  return c.webhook || c.email;
}

async function sendWebhook(inquiry: InquiryInput, meta: { receivedAt: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = envVar("INQUIRY_WEBHOOK_SECRET");
  if (secret) headers["x-inquiry-secret"] = secret;
  const res = await fetch(envVar("INQUIRY_WEBHOOK_URL"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      source: "ali-arshad-studio",
      formType: "contact_inquiry",
      ...meta,
      inquiry,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
}

async function sendEmail(inquiry: InquiryInput, meta: { receivedAt: string }) {
  const rows = [
    { label: "Form Source", value: "Contact / Project Inquiry (/contact)" },
    { label: "Name", value: inquiry.name },
    { label: "Email", value: inquiry.email, href: `mailto:${inquiry.email}` },
    { label: "Company / Brand", value: inquiry.company || "—" },
    { label: "Service Requested", value: inquiry.service },
    { label: "Budget Range", value: inquiry.budget || "—" },
    { label: "Expected Timeline", value: inquiry.timeline || "—" },
    { label: "Received (UTC)", value: meta.receivedAt },
  ];

  const html = buildLabeledEmailHtml({
    badge: "Portfolio Contact Inquiry",
    heading: `New project inquiry from ${inquiry.name}`,
    introNote: "Submitted via the Contact form (/contact). Reply directly to respond to the client.",
    rows,
    messageHeading: "Project Description",
    messageBody: inquiry.description,
  });

  const text =
    "=== PORTFOLIO CONTACT INQUIRY ===\n" +
    rows.map((r) => `${r.label}: ${r.value}`).join("\n") +
    `\n\n--- Project Description ---\n${inquiry.description}`;

  await sendResendEmail({
    apiKey: envVar("RESEND_API_KEY"),
    from: envVar("INQUIRY_FROM_EMAIL"),
    to: [envVar("INQUIRY_TO_EMAIL")],
    replyTo: inquiry.email,
    subject: `[Contact Inquiry] ${inquiry.service} — ${inquiry.name}`,
    html,
    text,
    formTag: "contact_inquiry",
    formHeader: "contact-inquiry",
  });
}

/**
 * Deliver to every configured channel.
 * Returns delivered=true only if at least one channel confirmed receipt.
 */
export async function deliverInquiry(inquiry: InquiryInput): Promise<{ delivered: boolean; failures: string[] }> {
  const channels = deliveryChannels();
  const meta = { receivedAt: new Date().toISOString() };
  const tasks: Promise<void>[] = [];
  if (channels.webhook) tasks.push(sendWebhook(inquiry, meta));
  if (channels.email) tasks.push(sendEmail(inquiry, meta));

  const results = await Promise.allSettled(tasks);
  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
  return { delivered: results.some((r) => r.status === "fulfilled"), failures };
}
