/**
 * Server-only inquiry delivery. Reads secrets from environment variables.
 * Never import this file from a client component.
 */
import type { InquiryInput } from "@/lib/inquiry";

const env = (k: string) => (process.env[k] ?? "").trim();

export function deliveryChannels() {
  return {
    webhook: env("INQUIRY_WEBHOOK_URL") !== "",
    email: env("RESEND_API_KEY") !== "" && env("INQUIRY_TO_EMAIL") !== "" && env("INQUIRY_FROM_EMAIL") !== "",
  };
}

export function isDeliveryConfigured(): boolean {
  const c = deliveryChannels();
  return c.webhook || c.email;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function sendWebhook(inquiry: InquiryInput, meta: { receivedAt: string }) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const secret = env("INQUIRY_WEBHOOK_SECRET");
  if (secret) headers["x-inquiry-secret"] = secret;
  const res = await fetch(env("INQUIRY_WEBHOOK_URL"), {
    method: "POST",
    headers,
    body: JSON.stringify({ source: "ali-arshad-studio", ...meta, inquiry }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
}

async function sendEmail(inquiry: InquiryInput, meta: { receivedAt: string }) {
  const rows: [string, string][] = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Company / brand", inquiry.company || "—"],
    ["Service", inquiry.service],
    ["Budget", inquiry.budget || "—"],
    ["Timeline", inquiry.timeline || "—"],
    ["Received", meta.receivedAt],
  ];
  const html =
    `<h2>New project inquiry</h2><table cellpadding="6">` +
    rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join("") +
    `</table><h3>Project description</h3><p style="white-space:pre-wrap">${escapeHtml(inquiry.description)}</p>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${inquiry.description}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("INQUIRY_FROM_EMAIL"),
      to: [env("INQUIRY_TO_EMAIL")],
      reply_to: inquiry.email,
      subject: `New inquiry — ${inquiry.name} (${inquiry.service})`,
      html,
      text,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Email provider responded with ${res.status}`);
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
