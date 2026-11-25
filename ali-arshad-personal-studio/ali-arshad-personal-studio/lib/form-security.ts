/**
 * Server-only security, HTML escaping, and Resend transactional email delivery helpers.
 * Never import this file from a client component.
 */

export const envVar = (key: string): string => (process.env[key] ?? "").trim();

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip CR/LF and control characters so user input can never inject SMTP/MIME headers. */
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Extract the best available client IP for per-IP rate limiting.
 * Prefers Vercel's edge-populated `x-vercel-forwarded-for` before generic proxy headers.
 */
export function extractClientIp(request: Request): string {
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const first = vercelForwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reject cross-site browser form posts whose Origin host does not match the request host. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // non-browser clients; still validated, spam-checked, and rate-limited
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Check whether a form fill timing value passes the minimum human interaction threshold. */
export function isPlausibleFillTime(elapsedMs: unknown, minFillMs: number): boolean {
  return typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs >= minFillMs;
}

export type ResendEmailPayload = {
  apiKey: string;
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  formTag: "contact_inquiry" | "studio_network_application";
  formHeader: "contact-inquiry" | "studio-network-application";
};

async function readSafeProviderError(res: Response): Promise<string> {
  try {
    const raw = (await res.text()).trim();
    if (!raw) return `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(raw) as { message?: unknown; name?: unknown };
      const msg = typeof parsed.message === "string" ? parsed.message : "";
      const name = typeof parsed.name === "string" ? parsed.name : "";
      const summary = [name, msg].filter(Boolean).join(": ");
      if (summary) return `HTTP ${res.status} (${summary.slice(0, 180)})`;
    } catch {
      // Plain text error body
    }
    return `HTTP ${res.status} (${raw.slice(0, 140)})`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

/**
 * Send a transactional email via Resend's HTTPS REST API.
 * Throws a safe, secret-free diagnostic Error if Resend does not return 2xx.
 */
export async function sendResendEmail(payload: ResendEmailPayload): Promise<{ id?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${payload.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sanitizeHeaderValue(payload.from),
      to: payload.to.map(sanitizeHeaderValue),
      reply_to: sanitizeHeaderValue(payload.replyTo),
      subject: sanitizeHeaderValue(payload.subject),
      html: payload.html,
      text: payload.text,
      headers: {
        "X-Portfolio-Form": payload.formHeader,
      },
      tags: [{ name: "form", value: payload.formTag }],
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await readSafeProviderError(res);
    throw new Error(`Email provider responded with ${detail}`);
  }

  try {
    const data = (await res.json()) as { id?: string };
    return { id: typeof data?.id === "string" ? data.id : undefined };
  } catch {
    return {};
  }
}

/** Build a clean, readable, table-based HTML email wrapper for Gmail / desktop / mobile clients. */
export function buildLabeledEmailHtml(opts: {
  badge: string;
  heading: string;
  introNote: string;
  rows: { label: string; value: string; href?: string }[];
  messageHeading: string;
  messageBody: string;
}): string {
  const rowsHtml = opts.rows
    .map(({ label, value, href }) => {
      const safeVal = escapeHtml(value);
      const cell = href
        ? `<a href="${escapeHtml(href)}" style="color:#c94c30;text-decoration:underline">${safeVal}</a>`
        : safeVal;
      return (
        `<tr>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;font-weight:600;width:190px;vertical-align:top">${escapeHtml(label)}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;vertical-align:top">${cell}</td>` +
        `</tr>`
      );
    })
    .join("");

  return (
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;color:#111827;line-height:1.55">` +
    `<p style="margin:0 0 10px"><span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#111827;color:#ff8a6b;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase">${escapeHtml(opts.badge)}</span></p>` +
    `<h2 style="margin:0 0 6px;font-size:20px;color:#111827">${escapeHtml(opts.heading)}</h2>` +
    `<p style="margin:0 0 18px;font-size:13px;color:#4b5563">${escapeHtml(opts.introNote)}</p>` +
    `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px">${rowsHtml}</table>` +
    `<h3 style="margin:22px 0 8px;font-size:15px;color:#111827">${escapeHtml(opts.messageHeading)}</h3>` +
    `<div style="padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;white-space:pre-wrap;font-size:14px;color:#111827">${escapeHtml(opts.messageBody)}</div>` +
    `</div>`
  );
}
