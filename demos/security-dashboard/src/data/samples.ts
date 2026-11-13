/** Sample inputs so the tool is usable without the user having to go and get data. */

export const SAMPLE_HEADERS = {
  hardened: `HTTP/2 200
content-type: text/html; charset=utf-8
strict-transport-security: max-age=63072000; includeSubDomains; preload
content-security-policy: default-src 'none'; script-src 'self' 'nonce-r4nd0m' 'strict-dynamic'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=(), payment=()
cross-origin-opener-policy: same-origin
set-cookie: __Host-session=abc123; Path=/; Secure; HttpOnly; SameSite=Strict`,

  typical: `HTTP/1.1 200 OK
Date: Mon, 13 Apr 2026 10:12:44 GMT
Server: Apache/2.4.41 (Ubuntu)
X-Powered-By: PHP/7.4.3
Content-Type: text/html; charset=UTF-8
Strict-Transport-Security: max-age=86400
Content-Security-Policy: default-src 'self' *; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:
X-Frame-Options: SAMEORIGIN
Set-Cookie: PHPSESSID=9f2c1ab77e; path=/
Set-Cookie: prefs=dark; path=/; Max-Age=31536000`,

  bare: `HTTP/1.1 200 OK
Content-Type: text/html
Server: nginx/1.18.0
Content-Length: 4821`,
};

export const SAMPLE_AUDIT = JSON.stringify(
  {
    auditReportVersion: 2,
    vulnerabilities: {
      "minimatch": {
        name: "minimatch", severity: "high", isDirect: false,
        via: [{ source: 1096466, name: "minimatch", title: "minimatch ReDoS", url: "https://github.com/advisories/GHSA-f8q6-p94x-37v3", severity: "high", range: "<3.0.5" }],
        effects: ["recursive-readdir"], range: "<3.0.5", nodes: ["node_modules/minimatch"],
        fixAvailable: { name: "recursive-readdir", version: "3.0.0", isSemVerMajor: true },
      },
      "recursive-readdir": {
        name: "recursive-readdir", severity: "high", isDirect: true,
        via: ["minimatch"], effects: [], range: "<=2.2.3", nodes: ["node_modules/recursive-readdir"],
        fixAvailable: { name: "recursive-readdir", version: "3.0.0", isSemVerMajor: true },
      },
      "tough-cookie": {
        name: "tough-cookie", severity: "moderate", isDirect: true,
        via: [{ source: 1097682, name: "tough-cookie", title: "tough-cookie prototype pollution", url: "https://github.com/advisories/GHSA-72xf-g2v4-qvf3", severity: "moderate", range: "<4.1.3" }],
        effects: [], range: "<4.1.3", nodes: ["node_modules/tough-cookie"],
        fixAvailable: true,
      },
      "semver": {
        name: "semver", severity: "moderate", isDirect: false,
        via: [{ source: 1096482, name: "semver", title: "semver ReDoS in range parsing", url: "https://github.com/advisories/GHSA-c2qf-rxjj-qqgw", severity: "moderate", range: ">=7.0.0 <7.5.2" }],
        effects: [], range: ">=7.0.0 <7.5.2", nodes: ["node_modules/semver"],
        fixAvailable: true,
      },
      "lodash.set": {
        name: "lodash.set", severity: "critical", isDirect: false,
        via: [{ source: 1094500, name: "lodash.set", title: "Prototype pollution in lodash.set", url: "https://github.com/advisories/GHSA-p6mc-m468-83gg", severity: "critical", range: "*" }],
        effects: ["config-loader"], range: "*", nodes: ["node_modules/lodash.set"],
        fixAvailable: false,
      },
      "config-loader": {
        name: "config-loader", severity: "critical", isDirect: true,
        via: ["lodash.set"], effects: [], range: "*", nodes: ["node_modules/config-loader"],
        fixAvailable: false,
      },
      "postcss": {
        name: "postcss", severity: "low", isDirect: false,
        via: [{ source: 1095000, name: "postcss", title: "postcss line return parsing error", url: "https://github.com/advisories/GHSA-7fh5-64p2-3v2j", severity: "low", range: "<8.4.31" }],
        effects: [], range: "<8.4.31", nodes: ["node_modules/postcss"],
        fixAvailable: true,
      },
    },
    metadata: { vulnerabilities: { info: 0, low: 1, moderate: 2, high: 2, critical: 2, total: 7 }, dependencies: { total: 742 } },
  },
  null,
  2,
);
