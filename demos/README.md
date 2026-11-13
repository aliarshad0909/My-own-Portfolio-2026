# Demonstration applications

Each subdirectory is a self-contained application with its own dependencies,
build, tests and README. They are **not** part of the portfolio's Next.js app
and must not be merged into it: keeping them separate means one demo's
dependencies or a runtime failure can never take the portfolio down.

| Demo | Project | Status | Stack | Hosting |
| --- | --- | --- | --- | --- |
| `commerce-storefront` | 01 — E-commerce | Demo Ready | React 19 + TypeScript, esbuild | Static (any host) |

## Deployment model

The portfolio stays at its own Vercel project. Each demo is deployed as a
**separate Vercel project** pointed at its own directory:

- Root directory: `demos/<name>`
- Build command and output directory: as in that demo's `vercel.json`

Once a demo is live, set `liveUrl` on its record in
`ali-arshad-personal-studio/ali-arshad-personal-studio/lib/projects.ts`. The
"View live demo" button then appears automatically on the project and case-study
pages. Leave `liveUrl` unset until the deployment is real — the button is driven
by the data, so an empty field simply hides it.

If a custom domain is bought later, subdomains such as `commerce.<domain>` keep
the demos tidy and separate from the portfolio. Nothing in the repository
assumes a domain exists.

## Rules for every demo here

1. **No fake functionality.** A control that cannot work is labelled, disabled or absent — never wired to a false success message.
2. **Sample data is labelled as sample data,** in the interface itself, not only in the README.
3. **No real credentials, ever.** Secrets come from environment variables and nothing is committed.
4. **Tests must actually run.** Each demo states what passes and what is unverified.
5. **Third-party code is attributed.** Any demo built on an open-source project keeps the upstream LICENSE in its directory and records the details in the portfolio's `attribution` field. See `docs/OPEN_SOURCE_RESEARCH.md`.
