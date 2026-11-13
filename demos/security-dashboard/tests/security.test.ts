import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { describe, it } from "node:test";
import { Asn1Error, decodeOid, parseDer, pemToDer, TAG } from "../src/lib/asn1.ts";
import { assessCertificate, matchesHost, parseCertificate } from "../src/lib/certificate.ts";
import { analyseCookies, analyseCsp, analyseHsts, analyseResponse, parseCsp, parseHeaderText } from "../src/lib/headers.ts";
import { AuditError, parseAudit, recommendation, rootsFor } from "../src/lib/advisories.ts";
import { SAMPLE_AUDIT, SAMPLE_HEADERS } from "../src/data/samples.ts";
import { FIXTURE_HISTORY, seriesFor, targets, trend } from "../src/data/watchlist.ts";

const pem = (name: string) => fs.readFileSync(new URL(`../fixtures/${name}.pem`, import.meta.url), "utf8");

/** openssl's own answer, for comparing ours against. */
const openssl = (name: string, ...args: string[]): string => {
  const path = new URL(`../fixtures/${name}.pem`, import.meta.url).pathname;
  return execFileSync("openssl", ["x509", "-in", path, "-noout", ...args], { encoding: "utf8" }).trim();
};

describe("ASN.1 / DER", () => {
  it("parses a certificate into nested elements", () => {
    const [root] = parseDer(pemToDer(pem("valid")));
    assert.equal(root.tag, TAG.SEQUENCE);
    assert.equal(root.constructed, true);
    assert.equal(root.children.length, 3, "a certificate is tbsCertificate, signatureAlgorithm, signatureValue");
  });

  it("decodes object identifiers", () => {
    // 1.2.840.113549.1.1.11 = sha256WithRSAEncryption
    assert.equal(decodeOid(new Uint8Array([0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b])), "1.2.840.113549.1.1.11");
    // 2.5.4.3 = commonName
    assert.equal(decodeOid(new Uint8Array([0x55, 0x04, 0x03])), "2.5.4.3");
  });

  it("refuses truncated and malformed input rather than returning rubbish", () => {
    assert.throws(() => parseDer(new Uint8Array([0x30, 0x82, 0xff, 0xff])), Asn1Error);
    assert.throws(() => parseDer(new Uint8Array([0x30, 0x80])), /Indefinite lengths/);
    assert.throws(() => pemToDer("not a certificate"), /No PEM certificate block/);
    assert.throws(() => pemToDer("-----BEGIN CERTIFICATE-----\n\n-----END CERTIFICATE-----"), /empty/);
  });
});

describe("certificate parsing, checked against openssl", () => {
  const cases = ["valid", "wildcard", "weakkey", "sha1", "ecdsa", "longlife", "nosan", "expired"];

  it("reads the same subject openssl reads", () => {
    for (const name of cases) {
      const ours = parseCertificate(pem(name)).subjectText;
      const theirs = openssl(name, "-subject").replace(/^subject=\s*/, "").replace(/\s*=\s*/g, "=");
      assert.equal(ours, theirs, name);
    }
  });

  it("reads the same validity window openssl reads", () => {
    for (const name of cases) {
      const cert = parseCertificate(pem(name));
      const dates = openssl(name, "-dates");
      const notBefore = new Date(/notBefore=(.*)/.exec(dates)![1]);
      const notAfter = new Date(/notAfter=(.*)/.exec(dates)![1]);
      assert.equal(cert.notBefore.getTime(), notBefore.getTime(), `${name} notBefore`);
      assert.equal(cert.notAfter.getTime(), notAfter.getTime(), `${name} notAfter`);
    }
  });

  it("reads the same subjectAltName list openssl reads", () => {
    for (const name of cases.filter((n) => n !== "nosan")) {
      const ours = parseCertificate(pem(name)).sans;
      const theirs = openssl(name, "-ext", "subjectAltName")
        .split("\n").slice(1).join(" ")
        .split(",").map((s) => s.trim().replace(/^DNS:/, "")).filter(Boolean);
      assert.deepEqual(ours, theirs, name);
    }
  });

  it("finds no subjectAltName where there is none", () => {
    assert.deepEqual(parseCertificate(pem("nosan")).sans, []);
  });

  it("reads key algorithm and size", () => {
    assert.deepEqual(parseCertificate(pem("valid")).publicKey, { algorithm: "RSA", oid: "1.2.840.113549.1.1.1", bits: 2048 });
    assert.equal(parseCertificate(pem("weakkey")).publicKey.bits, 1024);
    assert.equal(parseCertificate(pem("ecdsa")).publicKey.algorithm, "EC");
    assert.equal(parseCertificate(pem("ecdsa")).publicKey.bits, 256);
  });

  it("reads the signature algorithm and knows which are broken", () => {
    assert.equal(parseCertificate(pem("valid")).signatureAlgorithm.name, "sha256WithRSAEncryption");
    assert.equal(parseCertificate(pem("valid")).signatureAlgorithm.weak, false);
    assert.equal(parseCertificate(pem("sha1")).signatureAlgorithm.name, "sha1WithRSAEncryption");
    assert.equal(parseCertificate(pem("sha1")).signatureAlgorithm.weak, true);
  });
});

describe("certificate assessment", () => {
  const titles = (name: string, host?: string) =>
    assessCertificate(parseCertificate(pem(name)), new Date(), host).map((f) => `${f.severity}:${f.title}`);

  it("calls an expired certificate critical", () => {
    const found = titles("expired");
    assert.ok(found.some((t) => t.startsWith("critical:Expired")), found.join(" | "));
  });

  it("passes a certificate with time left", () => {
    assert.ok(titles("valid").some((t) => /^pass:Valid for \d+ more days/.test(t)));
  });

  it("flags a 1024-bit RSA key as critical", () => {
    assert.ok(titles("weakkey").some((t) => t === "critical:RSA key is only 1024 bits"));
  });

  it("flags SHA-1 as critical", () => {
    assert.ok(titles("sha1").some((t) => t.startsWith("critical:Weak signature algorithm: sha1")));
  });

  it("flags a certificate with no subjectAltName", () => {
    assert.ok(titles("nosan").some((t) => t === "high:No subjectAltName"));
  });

  it("flags a lifetime over the 398-day browser limit", () => {
    assert.ok(titles("longlife").some((t) => /^medium:Lifetime is \d+ days/.test(t)));
    assert.equal(titles("valid").some((t) => t.startsWith("medium:Lifetime")), false);
  });

  it("checks the hostname against the SAN list", () => {
    assert.ok(titles("valid", "demo.example.com").some((t) => t === "pass:Covers demo.example.com"));
    assert.ok(titles("valid", "other.example.com").some((t) => t === "critical:Does not cover other.example.com"));
  });

  it("matches wildcards the way browsers do: one label, leftmost only", () => {
    assert.equal(matchesHost("*.example.com", "www.example.com"), true);
    assert.equal(matchesHost("*.example.com", "a.b.example.com"), false, "a wildcard covers one label, not two");
    assert.equal(matchesHost("*.example.com", "example.com"), false, "a wildcard does not cover the bare domain");
    assert.equal(matchesHost("example.com", "example.com"), true);
    assert.equal(matchesHost("EXAMPLE.com", "example.COM"), true);
  });

  it("notices a self-signed certificate", () => {
    assert.ok(titles("valid").some((t) => t === "high:Self-signed"));
  });
});

describe("header parsing", () => {
  it("reads the status line and folds names to lowercase", () => {
    const { headers, status } = parseHeaderText("HTTP/2 404\nContent-Type: text/html\nSERVER: nginx");
    assert.equal(status, 404);
    assert.equal(headers.get("content-type"), "text/html");
    assert.equal(headers.get("server"), "nginx");
  });

  it("keeps repeated Set-Cookie values and warns about other repeats", () => {
    const { headers, warnings } = parseHeaderText("Set-Cookie: a=1\nSet-Cookie: b=2\nX-Frame-Options: DENY\nX-Frame-Options: SAMEORIGIN");
    assert.equal(headers.get("set-cookie"), "a=1\nb=2");
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /x-frame-options.*more than once/);
  });

  it("ignores junk lines rather than crashing", () => {
    const { headers, warnings } = parseHeaderText("this is not a header\nContent-Type: text/html");
    assert.equal(headers.size, 1);
    assert.match(warnings[0], /no colon/);
  });
});

describe("CSP analysis", () => {
  const titles = (csp: string) => analyseCsp(csp).map((f) => `${f.severity}:${f.title}`);

  it("splits a policy into directives", () => {
    const policy = parseCsp("default-src 'self'; script-src 'self' 'nonce-abc'; object-src 'none'");
    assert.deepEqual(policy.get("script-src"), ["'self'", "'nonce-abc'"]);
    assert.deepEqual(policy.get("object-src"), ["'none'"]);
  });

  it("flags unsafe-inline without a nonce as high", () => {
    assert.ok(titles("script-src 'self' 'unsafe-inline'").some((t) => t === "high:script-src allows 'unsafe-inline'"));
  });

  it("downgrades unsafe-inline when a nonce is present, because browsers ignore it then", () => {
    const found = titles("script-src 'self' 'unsafe-inline' 'nonce-r4nd0m'");
    assert.equal(found.some((t) => t.startsWith("high:script-src allows 'unsafe-inline'")), false);
    assert.ok(found.some((t) => t.startsWith("low:script-src has 'unsafe-inline' alongside")));
  });

  it("flags unsafe-eval and wildcard sources", () => {
    assert.ok(titles("script-src 'self' 'unsafe-eval'").some((t) => t === "medium:script-src allows 'unsafe-eval'"));
    assert.ok(titles("script-src https:").some((t) => t === "high:script-src allows any host"));
  });

  it("flags the directives default-src does not cover", () => {
    // base-uri and frame-ancestors do NOT fall back to default-src — a common misunderstanding.
    const found = titles("default-src 'self'");
    assert.ok(found.some((t) => t === "medium:No base-uri"));
    assert.ok(found.some((t) => t === "medium:No frame-ancestors"));
  });

  it("recognises a well-formed modern policy", () => {
    const found = titles("default-src 'none'; script-src 'self' 'nonce-x' 'strict-dynamic'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
    assert.ok(found.some((t) => t === "pass:script-src uses 'strict-dynamic'"));
    assert.ok(found.some((t) => t === "pass:frame-ancestors is set"));
    assert.equal(found.some((t) => t.startsWith("high:")), false, found.join(" | "));
  });

  it("treats an empty policy as doing nothing", () => {
    assert.deepEqual(titles("   "), ["high:Content-Security-Policy is empty"]);
  });
});

describe("HSTS analysis", () => {
  const titles = (v: string) => analyseHsts(v).map((f) => `${f.severity}:${f.title}`);

  it("requires max-age", () => {
    assert.deepEqual(titles("includeSubDomains"), ["high:Strict-Transport-Security has no max-age"]);
  });

  it("treats max-age=0 as clearing the policy", () => {
    assert.ok(titles("max-age=0").some((t) => t === "high:HSTS max-age is 0"));
  });

  it("wants at least 180 days", () => {
    assert.ok(titles("max-age=86400").some((t) => t === "medium:HSTS max-age is 1 days"));
    assert.ok(titles("max-age=63072000; includeSubDomains; preload").some((t) => t === "pass:HSTS max-age is 730 days"));
  });

  it("catches preload without includeSubDomains, which the preload list rejects", () => {
    assert.ok(titles("max-age=63072000; preload").some((t) => t === "medium:HSTS claims preload without includeSubDomains"));
  });
});

describe("cookie analysis", () => {
  const titles = (v: string) => analyseCookies(v).map((f) => `${f.severity}:${f.title}`);

  it("treats a session cookie without HttpOnly as high", () => {
    assert.ok(titles("PHPSESSID=abc; path=/").some((t) => t === 'high:Cookie "PHPSESSID" is not HttpOnly'));
  });

  it("is less alarmed by an ordinary cookie", () => {
    const found = titles("theme=dark; path=/");
    assert.ok(found.some((t) => t === 'low:Cookie "theme" is not HttpOnly'));
  });

  it("catches SameSite=None without Secure, which browsers drop", () => {
    assert.ok(titles("a=1; SameSite=None").some((t) => t === 'high:Cookie "a" is SameSite=None without Secure'));
  });

  it("enforces the __Host- prefix rules", () => {
    assert.ok(titles("__Host-sid=1; Secure; HttpOnly; SameSite=Lax; Domain=example.com; Path=/").some((t) => t.includes("__Host- prefix")));
    assert.equal(titles("__Host-sid=1; Path=/; Secure; HttpOnly; SameSite=Strict").some((t) => t.includes("__Host- prefix")), false);
  });

  it("passes a properly configured session cookie silently", () => {
    assert.deepEqual(titles("__Host-session=abc; Path=/; Secure; HttpOnly; SameSite=Strict"), []);
  });
});

describe("whole-response grading", () => {
  it("grades a hardened response A", () => {
    const hardened = analyseResponse(SAMPLE_HEADERS.hardened);
    assert.equal(hardened.grade, "A", `scored ${hardened.score}: ${hardened.findings.filter((f) => f.severity !== "pass").map((f) => f.title).join("; ")}`);
    assert.equal(hardened.findings.some((f) => f.severity === "critical" || f.severity === "high"), false);
  });

  it("ranks a misconfigured response below one with no headers at all", () => {
    // "typical" has HSTS, a CSP and X-Frame-Options, but also leaks a session
    // cookie with neither Secure nor HttpOnly. "bare" has no headers but no
    // live vulnerability either. Counting actual problems, typical is worse —
    // and the diminishing-returns scoring is what stops a verbose but broken
    // configuration from outranking a silent one purely by giving the
    // analyser less to find.
    const typical = analyseResponse(SAMPLE_HEADERS.typical);
    const bare = analyseResponse(SAMPLE_HEADERS.bare);
    assert.ok(typical.score < bare.score, `typical ${typical.score} should be below bare ${bare.score}`);
    assert.equal(typical.grade, "F");
    assert.equal(bare.grade, "C");
  });

  it("names the real problems in the typical sample", () => {
    const titles = analyseResponse(SAMPLE_HEADERS.typical).findings.map((f) => f.title);
    assert.ok(titles.some((t) => t.includes("'unsafe-inline'")));
    assert.ok(titles.some((t) => t.includes("PHPSESSID")));
    assert.ok(titles.some((t) => t.toLowerCase().includes("x-powered-by")));
    assert.ok(titles.some((t) => t === "high:default-src is a wildcard" || t === "default-src is a wildcard"));
  });

  it("the score is bounded and monotonic in severity", () => {
    const base = "HTTP/1.1 200 OK\n";
    const one = analyseResponse(base + "Set-Cookie: sid=1; Secure; HttpOnly; SameSite=Lax").score;
    const two = analyseResponse(base + "Set-Cookie: sid=1").score;
    assert.ok(two < one, "a worse cookie must not score higher");
    for (const s of [one, two]) assert.ok(s >= 0 && s <= 100);
  });

  it("reads the status code and header count", () => {
    const report = analyseResponse(SAMPLE_HEADERS.typical);
    assert.equal(report.status, 200);
    assert.ok(report.headerCount >= 8);
  });

  it("flags a wildcard CORS policy that also allows credentials", () => {
    const report = analyseResponse("HTTP/1.1 200 OK\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true");
    assert.ok(report.findings.some((f) => f.severity === "critical" && f.title.includes("CORS")));
  });

  it("notices X-Frame-Options and frame-ancestors disagreeing", () => {
    const report = analyseResponse("HTTP/1.1 200 OK\nX-Frame-Options: DENY\nContent-Security-Policy: frame-ancestors 'self'");
    assert.ok(report.findings.some((f) => f.title === "X-Frame-Options and frame-ancestors disagree"));
  });

  it("counts every finding by severity", () => {
    const report = analyseResponse(SAMPLE_HEADERS.typical);
    const total = Object.values(report.counts).reduce((a, b) => a + b, 0);
    assert.equal(total, report.findings.length);
  });

  it("never scores below zero, however bad the input", () => {
    const awful = analyseResponse("HTTP/1.1 200 OK\nAccess-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true\nSet-Cookie: sid=1; SameSite=None\nContent-Security-Policy: default-src *; script-src * 'unsafe-inline' 'unsafe-eval'");
    assert.equal(awful.score, 0);
    assert.equal(awful.grade, "F");
  });
});

describe("dependency advisories", () => {
  const summary = parseAudit(SAMPLE_AUDIT);

  it("reads every advisory and sorts worst first", () => {
    assert.equal(summary.advisories.length, 7);
    assert.equal(summary.advisories[0].severity, "critical");
    assert.equal(summary.worst, "critical");
  });

  it("maps npm's 'moderate' onto medium", () => {
    assert.equal(summary.advisories.find((a) => a.name === "tough-cookie")?.severity, "medium");
    assert.equal(summary.counts.medium, 2);
  });

  it("separates fixable, breaking and unfixable", () => {
    assert.equal(summary.fixable, 3);
    assert.equal(summary.breakingFixes, 2);
    assert.equal(summary.unfixable, 2);
    assert.equal(summary.fixable + summary.breakingFixes + summary.unfixable, summary.advisories.length);
  });

  it("walks the effects chain to the direct dependency the user must upgrade", () => {
    assert.deepEqual(rootsFor(summary, "minimatch"), ["recursive-readdir"]);
    assert.deepEqual(rootsFor(summary, "lodash.set"), ["config-loader"]);
    assert.deepEqual(rootsFor(summary, "tough-cookie"), ["tough-cookie"]);
  });

  it("does not loop for ever on a circular effects chain", () => {
    const circular = JSON.stringify({
      vulnerabilities: {
        a: { severity: "high", via: ["b"], effects: ["b"], range: "*", isDirect: false, fixAvailable: false },
        b: { severity: "high", via: ["a"], effects: ["a"], range: "*", isDirect: false, fixAvailable: false },
      },
    });
    const parsed = parseAudit(circular);
    assert.ok(rootsFor(parsed, "a").length > 0);
  });

  it("reads the dependency total", () => {
    assert.equal(summary.totalDependencies, 742);
  });

  it("writes a sentence someone can act on", () => {
    const text = recommendation(summary);
    assert.match(text, /7 advisories/);
    assert.match(text, /npm audit fix/);
    assert.match(text, /no fix published/);
  });

  it("explains bad input instead of throwing a parser error at the user", () => {
    assert.throws(() => parseAudit("{nope"), /not valid JSON/);
    assert.throws(() => parseAudit("{}"), /No `vulnerabilities` key/);
    assert.throws(() => parseAudit(JSON.stringify({ advisories: {} })), /npm 6 audit output/);
    assert.throws(() => parseAudit("{}"), AuditError);
  });
});

describe("watchlist", () => {
  it("ships a labelled fixture history and nothing else", () => {
    assert.equal(FIXTURE_HISTORY.every((e) => e.source === "fixture"), true);
    assert.deepEqual(targets(FIXTURE_HISTORY), ["example-shop.test"]);
  });

  it("orders a series oldest first and measures the trend", () => {
    const series = seriesFor(FIXTURE_HISTORY, "example-shop.test");
    assert.equal(series.length, 5);
    for (let i = 1; i < series.length; i++) assert.ok(series[i].at > series[i - 1].at);
    assert.deepEqual(trend(series), { delta: 61, direction: "up" });
  });

  it("reports no trend from a single point", () => {
    assert.equal(trend(FIXTURE_HISTORY.slice(0, 1)), null);
  });
});
