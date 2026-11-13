# Sentryline — Web Security Posture

Analyses security headers, TLS certificates and dependency advisories. Everything it
examines is data you paste in. It performs no scanning of any kind.

## Scope, stated plainly

This tool does not scan hosts, probe ports, enumerate subdomains, fingerprint
services or contact any third party. It sends nothing off the page. There is no code
path that makes an outbound request. Use it on systems you are responsible for.

That is not only a policy — it is also a technical fact about where this runs. A
browser cannot read another origin's response headers (CORS) and cannot inspect a TLS
certificate at all. A page claiming to "scan your site" from the browser is either
proxying through a server it does not mention, or lying. So the input is yours:
`curl -sSI`, devtools, `openssl s_client`, `npm audit --json`.

## What it does

**Response headers.** Grades a response head against the headers that matter, with the
reasoning shown rather than a bare score:

- CSP parsed directive by directive. Flags `'unsafe-inline'` without a nonce as high,
  but *downgrades* it when a nonce is present, because browsers ignore `'unsafe-inline'
  ` then. Flags the directives `default-src` does not cover — `base-uri` and
  `frame-ancestors` — which is a common and consequential misunderstanding.
- HSTS: max-age against the 180-day threshold, `preload` without `includeSubDomains`
  (which the preload list rejects outright), and `max-age=0`, which clears the policy.
- Cookies: `Secure`, `HttpOnly`, `SameSite`, the `SameSite=None`-without-`Secure`
  combination browsers drop, and the `__Host-` prefix rules. Session-looking names are
  graded harder than a theme preference.
- Conflicts and leaks: `X-Frame-Options` disagreeing with `frame-ancestors`, wildcard
  CORS alongside credentials, version disclosure in `Server` and `X-Powered-By`.

**Certificates.** A DER/ASN.1 parser reads subject, issuer, validity, key algorithm and
size, signature algorithm and subjectAltName, then assesses expiry, SHA-1, keys under
2048 bits, self-signing, missing SAN, lifetimes over the 398-day browser limit, and
whether a hostname you give is actually covered — with browser wildcard rules, so
`*.example.com` does not match `a.b.example.com` or the bare domain.

**Dependencies.** Reads `npm audit --json`, rolls up severities, walks the `effects`
chain to the direct dependency you would actually have to upgrade, and separates
fixable, breaking and unfixable.

## What it cannot do, and says so in the interface

- Verify a certificate's signature chain, reach a root store, or check revocation
  (OCSP, CRL). Those need a TLS client.
- Fetch anything, for the reasons above.
- Tell you whether a package version is vulnerable — npm's advisory database decided
  that; this makes the answer readable.

## The certificate parser is checked against openssl

`fixtures/` holds eight certificates generated with openssl and Python's
`cryptography` (valid, wildcard, 1024-bit, SHA-1, ECDSA, 1500-day, no-SAN, expired).
The test suite parses each one and asserts that the subject, the validity window and
the subjectAltName list match what `openssl x509` reports for the same file. If the
ASN.1 parser drifts, openssl disagrees and the suite fails.

## A scoring flaw the tests exposed

The first scoring model summed a penalty per finding. That graded a response with no
security headers at all (**C**) above one with eight headers configured badly
(**F**) — not because it was safer, but because it gave the analyser less to find. The
fix is diminishing returns: penalties sorted worst-first and decayed, so the worst
problem dominates and a long tail of small issues still moves the score without
runaway stacking. A test now asserts the ordering directly, and documents why the
misconfigured response deservedly ranks lower.

## Project type

**Original Concept.** Written from scratch — the ASN.1/DER parser, the CSP parser and
the rule engine are in `src/lib/`. No `node-forge`, no `pkijs`, no header-scanner
library. React, esbuild and Playwright are the only dependencies.

## Running it

```bash
npm install
npm run dev     # esbuild dev server on :5173
npm run build   # static bundle in ./dist
npm test        # 57 unit tests (needs openssl on PATH for the certificate comparisons)
```

```bash
npm run build && (cd dist && python3 -m http.server 8809) &
node e2e/smoke.mjs   # 23 browser tests
```

## Structure

```
src/lib/asn1.ts         DER parsing, OIDs, ASN.1 time
src/lib/certificate.ts  X.509 fields and assessment, wildcard host matching
src/lib/headers.ts      Header parsing, CSP/HSTS/cookie analysis, grading
src/lib/advisories.ts   npm audit report parsing and dependency-tree rollup
src/data/watchlist.ts   Recorded results, guarded localStorage, trend
fixtures/*.pem          Certificates generated for the test suite
```

## Deployment

Static output in `dist/`. `vercel.json` is present but **nothing has been deployed** —
no Vercel project created, no domain purchased.
