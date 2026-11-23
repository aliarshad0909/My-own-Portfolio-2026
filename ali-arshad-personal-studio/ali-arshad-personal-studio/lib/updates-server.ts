/**
 * Server-only delivery for optional Studio Updates signups.
 * Uses explicit UPDATES_WEBHOOK_URL or Resend notification only when configured.
 */
import type { UpdatesInput } from "@/lib/updates";

const env = (k: string) => (process.env[k] ?? "").trim();

export function updatesDeliveryChannels() {
  const webhook = env("UPDATES_WEBHOOK_URL") !== "";
  const email =
    env("RESEND_API_KEY") !== "" &&
    (env("UPDATES_TO_EMAIL") !== "" || env("INQUIRY_TO_EMAIL") !== "") &&
    env("INQUIRY_FROM_EMAIL") !== "";
  return { webhook, email };
}

export function isUpdatesConfigured(): boolean {
  const c = updatesDeliveryChannels();
  return c.webhook || c.email;
}

export async function deliverUpdatesSignup(
  signup: UpdatesInput,
): Promise<{ delivered: boolean; failures: string[] }> {
  const channels = updatesDeliveryChannels();
  const receivedAt = new Date().toISOString();
  const tasks: Promise<void>[] = [];

  if (channels.webhook) {
    tasks.push(
      (async () => {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const secret = env("UPDATES_WEBHOOK_SECRET") || env("INQUIRY_WEBHOOK_SECRET");
        if (secret) headers["x-inquiry-secret"] = secret;
        const res = await fetch(env("UPDATES_WEBHOOK_URL"), {
          method: "POST",
          headers,
          body: JSON.stringify({ source: "ali-arshad-studio-updates", receivedAt, signup }),
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Webhook responded with ${res.status}`);
      })(),
    );
  }

  if (channels.email) {
    tasks.push(
      (async () => {
        const to = env("UPDATES_TO_EMAIL") || env("INQUIRY_TO_EMAIL");
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env("RESEND_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: env("INQUIRY_FROM_EMAIL"),
            to: [to],
            reply_to: signup.email,
            subject: `Studio updates signup: ${signup.email}`,
            text: `Email: ${signup.email}\nTopic: ${signup.topic}\nConsent: confirmed\nReceived: ${receivedAt}`,
          }),
          signal: AbortSignal.timeout(8000),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Email provider responded with ${res.status}`);
      })(),
    );
  }

  const results = await Promise.allSettled(tasks);
  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
  return { delivered: results.some((r) => r.status === "fulfilled"), failures };
}
