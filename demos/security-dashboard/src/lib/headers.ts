import type { Finding, Severity } from "./certificate.ts";

/**
 * Security-header analysis.
 *
 * Input is response headers the user supplies — from `curl -I`, from browser
 * devtools, from their own CI. Nothing here fetches anything: a page cannot
 * read another origin's response headers, and a tool that pretended to would
 * be lying about where its data came from.
 */

export type Headers = Map<string, string>;

/** Parse the raw text of an HTTP response head. Case-insensitive; folds repeats. */
export function parseHeaderText(text: string): { headers: Headers; status: number | null; warnings: string[] } {
  const headers: Headers = new Map();
  const warnings: string[] = [];
  let status: number | null = null;

  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") continue;

    const statusMatch = /^HTTP\/[\d.]+\s+(\d{3})/i.exec(line);
    if (statusMatch) { status = Number(statusMatch[1]); continue; }

    const index = line.indexOf(":");
    if (index <= 0) { warnings.push(`Ignored a line with no colon: "${line.slice(0, 60)}"`); continue; }

    const name = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (headers.has(name)) {
      // Set-Cookie legitimately repeats; most others repeating is a misconfiguration.
      headers.set(name, `${headers.get(name)}\n${value}`);
      if (name !== "set-cookie") warnings.push(`"${name}" appears more than once. Browsers may use either value.`);
    } else {
      headers.set(name, value);
    }
  }

  return { headers, status, warnings };
}

/* ---------------- CSP ---------------- */

export type Csp = Map<string, string[]>;

export function parseCsp(value: string): Csp {
  const policy: Csp = new Map();
  for (const part of value.split(";")) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const [directive, ...sources] = tokens;
    policy.set(directive.toLowerCase(), sources);
  }
  return policy;
}

const FETCH_FALLBACK = "default-src";

export function analyseCsp(value: string): Finding[] {
  const policy = parseCsp(value);
  const findings: Finding[] = [];
  const effective = (directive: string): string[] | undefined => policy.get(directive) ?? policy.get(FETCH_FALLBACK);

  if (policy.size === 0) {
    return [{ severity: "high", title: "Content-Security-Policy is empty", detail: "The header is present but contains no directives, so it restricts nothing." }];
  }

  const script = effective("script-src");
  if (!script) {
    findings.push({ severity: "high", title: "No script-src and no default-src", detail: "Scripts are unrestricted. This is the directive that actually stops injected JavaScript running." });
  } else {
    if (script.includes("'unsafe-inline'") && !script.some((s) => s.startsWith("'nonce-") || s.startsWith("'sha256-"))) {
      findings.push({ severity: "high", title: "script-src allows 'unsafe-inline'", detail: "Inline scripts are permitted, which defeats most of what CSP is for against XSS. Use a nonce or a hash instead." });
    } else if (script.includes("'unsafe-inline'")) {
      findings.push({ severity: "low", title: "script-src has 'unsafe-inline' alongside a nonce or hash", detail: "Browsers that understand the nonce ignore 'unsafe-inline'. It is only a fallback for very old browsers; drop it when you can." });
    }
    if (script.includes("'unsafe-eval'")) {
      findings.push({ severity: "medium", title: "script-src allows 'unsafe-eval'", detail: "eval and Function-from-string are permitted. Usually a bundler or template library; worth tracking down." });
    }
    if (script.includes("*") || script.includes("https:") || script.includes("http:")) {
      findings.push({ severity: "high", title: "script-src allows any host", detail: `A wildcard source (${script.find((s) => s === "*" || s === "https:" || s === "http:")}) means scripts may be loaded from anywhere.` });
    }
    if (script.includes("'strict-dynamic'")) {
      findings.push({ severity: "pass", title: "script-src uses 'strict-dynamic'", detail: "Host allowlists are ignored in favour of nonces and hashes, which is the recommended modern shape." });
    }
  }

  if (!policy.has("object-src") && !policy.has(FETCH_FALLBACK)) {
    findings.push({ severity: "medium", title: "No object-src", detail: "Plugin content is unrestricted. `object-src 'none'` costs nothing and closes a legacy injection route." });
  } else if ((effective("object-src") ?? []).includes("'none'")) {
    findings.push({ severity: "pass", title: "object-src is 'none'", detail: "Plugin content is blocked." });
  }

  if (!policy.has("base-uri")) {
    findings.push({ severity: "medium", title: "No base-uri", detail: "An injected <base> tag can redirect every relative URL on the page. `base-uri 'self'` prevents it, and default-src does not cover this directive." });
  }

  if (!policy.has("frame-ancestors")) {
    findings.push({ severity: "medium", title: "No frame-ancestors", detail: "Nothing in this policy prevents framing. frame-ancestors supersedes X-Frame-Options and is not covered by default-src." });
  } else if ((policy.get("frame-ancestors") ?? []).some((s) => s === "*")) {
    findings.push({ severity: "high", title: "frame-ancestors allows any site", detail: "Any page can frame this one, which is the setup for clickjacking." });
  } else {
    findings.push({ severity: "pass", title: "frame-ancestors is set", detail: `Framing restricted to: ${policy.get("frame-ancestors")!.join(" ")}` });
  }

  if (policy.has("report-uri") && !policy.has("report-to")) {
    findings.push({ severity: "low", title: "report-uri without report-to", detail: "report-uri is deprecated. Chrome has moved to the Reporting API; send both during the transition." });
  }

  const objectLike = (effective("default-src") ?? []);
  if (objectLike.includes("*")) {
    findings.push({ severity: "high", title: "default-src is a wildcard", detail: "Every fetch directive falls back to 'allow anything'." });
  }

  return findings;
}

/* ---------------- HSTS ---------------- */

export function analyseHsts(value: string): Finding[] {
  const findings: Finding[] = [];
  const maxAgeMatch = /max-age\s*=\s*"?(\d+)"?/i.exec(value);
  if (!maxAgeMatch) {
    return [{ severity: "high", title: "Strict-Transport-Security has no max-age", detail: "Without max-age the header does nothing at all." }];
  }
  const seconds = Number(maxAgeMatch[1]);
  const days = Math.round(seconds / 86400);
  if (seconds === 0) {
    findings.push({ severity: "high", title: "HSTS max-age is 0", detail: "This actively clears any previously stored HSTS policy for the host." });
  } else if (seconds < 15_552_000) {
    findings.push({ severity: "medium", title: `HSTS max-age is ${days} days`, detail: "The usual recommendation, and the requirement for preload, is at least 180 days (15552000 seconds)." });
  } else {
    findings.push({ severity: "pass", title: `HSTS max-age is ${days} days`, detail: "At or above the recommended 180 days." });
  }

  if (!/includeSubDomains/i.test(value)) {
    findings.push({ severity: "low", title: "HSTS without includeSubDomains", detail: "Subdomains can still be reached over plain HTTP. Check that no subdomain needs it before adding." });
  }
  if (/preload/i.test(value) && !/includeSubDomains/i.test(value)) {
    findings.push({ severity: "medium", title: "HSTS claims preload without includeSubDomains", detail: "The preload list will not accept this policy. The directive is doing nothing." });
  }
  return findings;
}

/* ---------------- cookies ---------------- */

export function analyseCookies(raw: string): Finding[] {
  const findings: Finding[] = [];
  for (const cookie of raw.split("\n")) {
    const name = cookie.split("=")[0]?.trim() ?? "(unnamed)";
    const attrs = cookie.toLowerCase();
    const sessionish = /sess|auth|token|sid|login|jwt/i.test(name);

    if (!attrs.includes("secure")) {
      findings.push({ severity: sessionish ? "high" : "medium", title: `Cookie "${name}" is not Secure`, detail: "It will be sent over plain HTTP, where anyone on the path can read it." });
    }
    if (!attrs.includes("httponly")) {
      findings.push({ severity: sessionish ? "high" : "low", title: `Cookie "${name}" is not HttpOnly`, detail: sessionish ? "A session cookie readable by JavaScript can be stolen by any XSS on the site." : "JavaScript can read this cookie." });
    }
    const sameSite = /samesite=(\w+)/.exec(attrs)?.[1];
    if (!sameSite) {
      findings.push({ severity: "low", title: `Cookie "${name}" has no SameSite`, detail: "Browsers default to Lax, but stating it avoids surprises and silences console warnings." });
    } else if (sameSite === "none" && !attrs.includes("secure")) {
      findings.push({ severity: "high", title: `Cookie "${name}" is SameSite=None without Secure`, detail: "Browsers reject this combination outright, so the cookie is dropped." });
    }
    if (name.startsWith("__Host-") && (!attrs.includes("path=/") || attrs.includes("domain="))) {
      findings.push({ severity: "medium", title: `Cookie "${name}" breaks the __Host- prefix rules`, detail: "A __Host- cookie must be Secure, have Path=/ and no Domain attribute, or the browser rejects it." });
    }
  }
  return findings;
}

/* ---------------- the whole response ---------------- */

type Rule = {
  header: string;
  required: boolean;
  missingSeverity: Severity;
  missingTitle: string;
  missingDetail: string;
  check?: (value: string) => Finding[];
};

const RULES: Rule[] = [
  {
    header: "strict-transport-security", required: true, missingSeverity: "high",
    missingTitle: "No Strict-Transport-Security",
    missingDetail: "Without HSTS the first request to the host can be downgraded to HTTP and intercepted.",
    check: analyseHsts,
  },
  {
    header: "content-security-policy", required: true, missingSeverity: "high",
    missingTitle: "No Content-Security-Policy",
    missingDetail: "Nothing constrains where scripts, styles and frames may come from. This is the single most useful header against XSS.",
    check: analyseCsp,
  },
  {
    header: "x-content-type-options", required: true, missingSeverity: "medium",
    missingTitle: "No X-Content-Type-Options",
    missingDetail: "Browsers may sniff a response's type and execute something you served as text. Set it to nosniff.",
    check: (v) => v.trim().toLowerCase() === "nosniff"
      ? [{ severity: "pass", title: "X-Content-Type-Options: nosniff", detail: "MIME sniffing is disabled." }]
      : [{ severity: "medium", title: `X-Content-Type-Options is "${v}"`, detail: "The only valid value is nosniff; anything else is ignored." }],
  },
  {
    header: "referrer-policy", required: true, missingSeverity: "low",
    missingTitle: "No Referrer-Policy",
    missingDetail: "Browser defaults vary. strict-origin-when-cross-origin is a safe explicit choice.",
    check: (v) => {
      const value = v.trim().toLowerCase();
      if (value === "unsafe-url" || value === "no-referrer-when-downgrade") {
        return [{ severity: "medium", title: `Referrer-Policy is "${value}"`, detail: "Full URLs, including paths and query strings, are sent to other origins." }];
      }
      return [{ severity: "pass", title: `Referrer-Policy: ${value}`, detail: "Referrer information is constrained." }];
    },
  },
  {
    header: "permissions-policy", required: false, missingSeverity: "low",
    missingTitle: "No Permissions-Policy",
    missingDetail: "Camera, microphone, geolocation and similar are available to the page and to anything it frames. Deny what you do not use.",
  },
  {
    header: "x-frame-options", required: false, missingSeverity: "info",
    missingTitle: "No X-Frame-Options",
    missingDetail: "Fine if Content-Security-Policy sets frame-ancestors, which supersedes it.",
    check: (v) => /^(deny|sameorigin)$/i.test(v.trim())
      ? [{ severity: "pass", title: `X-Frame-Options: ${v.trim().toUpperCase()}`, detail: "Legacy clickjacking protection is in place." }]
      : [{ severity: "medium", title: `X-Frame-Options is "${v}"`, detail: "Only DENY and SAMEORIGIN are honoured; ALLOW-FROM was removed from browsers." }],
  },
];

const LEAKY_HEADERS: Record<string, string> = {
  server: "Reveals the server software, and often its exact version, to anyone scanning.",
  "x-powered-by": "Reveals the application framework and version. Remove it; it serves no purpose.",
  "x-aspnet-version": "Reveals the .NET version.",
  "x-generator": "Reveals the CMS and version.",
};

export type Report = {
  findings: Finding[];
  counts: Record<Severity, number>;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  status: number | null;
  warnings: string[];
  headerCount: number;
};

const WEIGHTS: Record<Severity, number> = { critical: 40, high: 20, medium: 9, low: 3.5, info: 0, pass: 0 };
/** Each successive penalty counts for less; see the note in analyseResponse. */
const DECAY = 0.78;

export function analyseResponse(text: string, now = new Date()): Report {
  const { headers, status, warnings } = parseHeaderText(text);
  const findings: Finding[] = [];

  for (const rule of RULES) {
    const value = headers.get(rule.header);
    if (value === undefined) {
      findings.push({ severity: rule.missingSeverity, title: rule.missingTitle, detail: rule.missingDetail });
    } else if (rule.check) {
      findings.push(...rule.check(value));
    } else {
      findings.push({ severity: "pass", title: `${rule.header} is set`, detail: value.slice(0, 160) });
    }
  }

  // X-Frame-Options and frame-ancestors disagreeing is a real and common mistake.
  const csp = headers.get("content-security-policy");
  const xfo = headers.get("x-frame-options");
  if (csp && xfo) {
    const ancestors = parseCsp(csp).get("frame-ancestors");
    if (ancestors && /deny/i.test(xfo) && !ancestors.includes("'none'")) {
      findings.push({ severity: "low", title: "X-Frame-Options and frame-ancestors disagree", detail: `X-Frame-Options says DENY but frame-ancestors says ${ancestors.join(" ")}. Modern browsers follow frame-ancestors.` });
    }
  }

  const cookies = headers.get("set-cookie");
  if (cookies) findings.push(...analyseCookies(cookies));

  for (const [name, why] of Object.entries(LEAKY_HEADERS)) {
    const value = headers.get(name);
    if (value) {
      const hasVersion = /\d+\.\d+/.test(value);
      findings.push({ severity: hasVersion ? "low" : "info", title: `${name}: ${value.slice(0, 60)}`, detail: why });
    }
  }

  if (headers.has("access-control-allow-origin")) {
    const origin = headers.get("access-control-allow-origin")!.trim();
    const credentials = /true/i.test(headers.get("access-control-allow-credentials") ?? "");
    if (origin === "*" && credentials) {
      findings.push({ severity: "critical", title: "CORS allows any origin with credentials", detail: "Browsers reject this combination, but its presence suggests the CORS configuration is reflecting origins unsafely. Check what the server does with a real Origin header." });
    } else if (origin === "*") {
      findings.push({ severity: "info", title: "Access-Control-Allow-Origin: *", detail: "Fine for public, non-credentialed resources. Not fine for anything behind a session." });
    }
  }

  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, pass: 0 } as Record<Severity, number>;
  for (const f of findings) counts[f.severity]++;

  /*
   * Penalties have diminishing returns. A flat sum punishes a site that
   * configured eight headers imperfectly more than one that configured none
   * at all, because the first site gives the analyser more to find. Sorting
   * the penalties worst-first and decaying each subsequent one keeps the
   * worst problem dominant while still letting a long tail of small issues
   * move the score.
   */
  const penalties = findings.map((f) => WEIGHTS[f.severity]).filter((w) => w > 0).sort((a, b) => b - a);
  const penalty = penalties.reduce((total, weight, index) => total + weight * DECAY ** index, 0);
  const score = Math.max(0, Math.round(100 - penalty));
  const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 55 ? "C" : score >= 35 ? "D" : "F";

  return { findings, counts, score, grade, status, warnings, headerCount: headers.size };
}
