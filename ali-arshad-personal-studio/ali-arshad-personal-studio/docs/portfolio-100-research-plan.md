# Portfolio Expansion Research & Planning Note (80 → 100 Projects + 20 Games)

**Internal planning document** — not surfaced as unsupported marketing claims on public pages.

## 1. Existing Inventory Verification (Baseline `origin/main` `5581027`)

- **Core builds (`p01`–`p14`, `14` entries):** 2 live public web sandboxes (`PipelineOS CRM`, `StockFlow Inventory`), 11 locally verified repository demos (`demos/*`), and 1 in-development Blender build (`demos/blender-product-viz`).
- **Monorepo prototypes (`p15`–`p24`, `10` entries):** 1 live mobile web preview (`apps/stockflow-mobile`) + 9 locally verified apps (`apps/bookos`, `financeos`, `flowos`, `insightos`, `orexa`, `peopleos`, `projectos`, `sourceos`, `supportos`).
- **Architecture concepts & sample scenarios (`p25`–`p80`, `56` entries):** Distinct domain concepts across 10 niches.
- **Confirmed baseline count:** `14 + 10 + 56 = 80` unique slugs (0 duplicates).

## 2. Recent Industry Sources Guiding the 20 New Technical Showcases (`p81`–`p100`)

1. **Stack Overflow 2025 Developer Survey** — Highlights the AI adoption-vs-trust gap (over 84% of developers using or planning to use AI tools while 46% report distrust in output accuracy), driving strong operational engineering need for automated evaluation harnesses, regression checks, and deterministic verification tooling.
2. **GitHub Octoverse & Agentic Engineering Trends (2025–2026)** — Documents rapid growth in AI-assisted pull requests and multi-model orchestration, shifting engineering bottlenecks toward review gates, automated contract diffing, secret scanning, and database migration safety.
3. **OWASP GenAI Security Project — Top 10 for Agentic Applications & LLM Applications** — Identifies tool-use hijacking, excessive agency, credential leakage, and MCP/tool boundary security as critical architectural gaps requiring least-privilege gateways and deterministic PII redaction.
4. **NIST AI Risk Management Framework (AI RMF) & Generative AI Profile (AI 600-1)** — Emphasizes measurable runtime observability, governance controls, citation grounding, and explicit escalation boundaries.
5. **FinOps Foundation — State of FinOps (2025–2026)** — Documents near-universal organizational focus on attributing AI/LLM token costs alongside SaaS and cloud spend back to product features and tenants.
6. **Shopify Commerce Trends & McKinsey Supply Chain Operations Insights (2025–2026)** — Emphasizes margin protection against rising acquisition/return costs, multi-channel catalog normalization, stochastic safety-stock simulation, and automated three-way PO/receipt/invoice reconciliation.

## 3. Selected 20 New Runnable Prototypes (`p81`–`p100` in `project-lab/`)

| ID | Slug | Technical Area | Runnable Vertical Slice (`project-lab/<slug>`) |
|---|---|---|---|
| `p81` | `agent-eval-harness` | AI Evaluation & Monitoring | Golden-set prompt/retrieval rubric evaluator & regression diff CLI |
| `p82` | `mcp-policy-gateway` | Agentic Security | Least-privilege JSON-RPC MCP tool allowlist, schema & approval gate |
| `p83` | `llm-finops-meter` | AI & Cloud FinOps | Multi-model token cost attribution & tenant anomaly budget engine |
| `p84` | `webhook-deadletter-replay` | Secure Workflow Automation | HMAC-SHA256 verifier, idempotency ledger & exponential backoff replay |
| `p85` | `secret-sprawl-guard` | Developer Security Tooling | Shannon-entropy + regex credential scanner with allowlist & SARIF |
| `p86` | `schema-migration-linter` | Database & Dev Tooling | Zero-downtime PostgreSQL DDL migration safety linter |
| `p87` | `rag-citation-verifier` | AI Grounding & QA | Sentence-level claim-to-source lexical grounding & abstention auditor |
| `p88` | `returns-margin-triage` | Ecommerce Operations | Returns economics, refurbishment threshold & exchange-vs-refund router |
| `p89` | `safety-stock-simulator` | Inventory & Supply Chain | Seeded Monte Carlo demand/lead-time variability safety-stock simulator |
| `p90` | `supplier-compliance-ledger` | Global Sourcing | Supplier ISO/RoHS/insurance certificate expiry & weighted risk ledger |
| `p91` | `feature-flag-evaluator` | SaaS Platform Engineering | Deterministic FNV-1a cohort rollout, segment rules & kill-switch engine |
| `p92` | `api-contract-diff` | API & Integration | OpenAPI breaking-change & schema regression diff CLI |
| `p93` | `pii-redaction-pipeline` | Privacy & AI Safety | Deterministic PII detector (email/phone/SSN/Luhn card) & tokenizer |
| `p94` | `catalog-feed-normalizer` | Ecommerce Operations | Multi-channel SKU feed normalizer & Google/Shopify schema validator |
| `p95` | `sla-incident-escalation` | Operations Analytics | Priority queue SLA burn-rate predictor & deterministic on-call router |
| `p96` | `ab-experiment-guard` | Product Analytics | Chi-squared Sample-Ratio Mismatch (SRM) & two-proportion z-test guard |
| `p97` | `invoice-three-way-match` | Finance & Supply Chain | PO, warehouse receipt & supplier bill 3-way reconciliation engine |
| `p98` | `design-token-wcag-auditor` | Accessibility & Design Ops | CSS custom-property parser & WCAG 2.2 AA/AAA contrast gate CLI |
| `p99` | `video-rendition-planner` | Creative Production Tooling | Adaptive bitrate ladder, even-dimension validator & transfer budget CLI |
| `p100` | `gpu-batch-cost-estimator` | Compute & AI Ops | VRAM headroom, quantization fit & batch cloud-vs-dedicated cost planner |

## 4. Runnable Source Map Across All 100 Projects + 20 Games

- **`p01`–`p14` (14 Core):** Linked to existing `apps/pipelineos`, `apps/stockflow`, and `demos/*`.
- **`p15`–`p24` (10 Monorepo Prototypes):** Linked to existing `apps/stockflow-mobile`, `apps/financeos`, `apps/flowos`, `apps/sourceos`, `apps/orexa`, `apps/supportos`, `apps/projectos`, `apps/insightos`, `apps/peopleos`, `apps/bookos`.
- **`p25`–`p80` (56 Concepts / Sample Scenarios):** Representative runnable workflow prototypes under `project-lab/concepts/<slug>/` with explicit Concept framing preserved on all public pages.
- **`p81`–`p100` (20 New Prototypes):** Dedicated vertical-slice prototypes under `project-lab/<slug>/`.
- **`g01`–`g20` (20 Playable Games):** Discoverable inside `/work` as `Personal Experiment` entries linking to `/games/<slug>` and exact source files under `ali-arshad-personal-studio/ali-arshad-personal-studio/lib/games/`.
