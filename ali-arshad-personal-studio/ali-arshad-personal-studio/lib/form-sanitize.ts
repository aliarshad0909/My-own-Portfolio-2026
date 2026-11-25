/**
 * Pure, client-and-server-safe input sanitizers for studio forms.
 * Strips control bytes and normalizes whitespace before validation and delivery.
 * No secrets or Node-only APIs in this file.
 */

const SINGLE_LINE_CONTROL_RE = /[\u0000-\u001F\u007F]/g;
const MULTILINE_CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Sanitize single-line fields (name, email, company, URL, location) against CRLF & control bytes. */
export function cleanSingleLine(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(SINGLE_LINE_CONTROL_RE, " ").replace(/\s+/g, " ").trim();
}

/** Sanitize multi-line textareas while preserving clean paragraph breaks. */
export function cleanMultiline(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(MULTILINE_CONTROL_RE, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/** Normalize an email address for validation and reply-to headers. */
export function cleanEmail(value: unknown): string {
  return cleanSingleLine(value).toLowerCase();
}
