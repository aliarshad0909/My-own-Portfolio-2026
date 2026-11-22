# Open-Source Provenance & License Compliance Registry

**Repository:** `https://github.com/aliarshad0909/My-own-Portfolio-2026`  
**Owner:** Ali Arshad — Personal Studio (`https://www.aliarshad.co`)  
**Policy:** Every application in the 12-product ecosystem runs exclusively on permissively licensed open-source dependencies (**MIT**, **Apache-2.0**, **BSD**, **ISC**). Copyleft (**AGPL-3.0 / GPL / SSPL**) and proprietary **Enterprise (`ee/` / `enterprise/`)** codebases are audited and excluded from production reuse.

---

## 1. Upstream Repository Evaluations & Compliance Decisions

| Product | Evaluated Upstream Repo | GitHub URL | Original Author | Verified License | Enterprise / Copyleft Trap | Files Reused | Architectural Decision & Attribution |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **PipelineOS** | `twentyhq/twenty` | https://github.com/twentyhq/twenty | Twenty PBC | AGPL-3.0 + Proprietary Enterprise (`/* @license Enterprise */`) | Strong network copyleft + proprietary Enterprise blocks + 2–4 GB RAM stack | **None (Rejected)** | Rejected for commercial reuse. |
| **PipelineOS** | `marmelab/atomic-crm` | https://github.com/marmelab/atomic-crm | Marmelab | **MIT** | None | **0 source files copied** (domain model reference only) | Clean-room Next.js 16 + Drizzle ORM + PostgreSQL implementation. Attributed in `apps/pipelineos/THIRD_PARTY_NOTICES.md` & case study. |
| **StockFlow & Mobile** | `inventree/InvenTree` | https://github.com/inventree/InvenTree | InvenTree Contributors | **MIT** | None (heavy Django + Redis + Celery stack) | **0 source files copied** (inventory ledger domain reference only) | Clean-room TypeScript/Next.js + React Native Expo SDK 52 implementation. Attributed in `apps/stockflow/THIRD_PARTY_NOTICES.md` & `apps/stockflow-mobile/THIRD_PARTY_NOTICES.md`. |
| **SupportOS** | `chatwoot/chatwoot` | https://github.com/chatwoot/chatwoot | Chatwoot Inc. | Dual: Core CE **MIT**, `enterprise/` **Proprietary Commercial** (`enterprise/LICENSE`) | SLA management, audit logs, and custom roles reside in proprietary `enterprise/` directory | **None (Rejected)** | Clean-room Next.js 16 + Drizzle + PostgreSQL helpdesk implementing SLA, shared inbox, KB, and non-auto-sending AI drafts independently. |
| **ProjectOS** | `makeplane/plane` | https://github.com/makeplane/plane | Plane Inc. | **AGPL-3.0** + Proprietary Pro/Business | Network copyleft requires open-sourcing entire hosted SaaS under AGPL-3.0 | **None (Rejected)** | Rejected AGPL source; clean-room Next.js 16 + Drizzle + PostgreSQL Kanban, dependencies, milestones & time tracking. |
| **BookOS** | `calcom/cal.com` | https://github.com/calcom/cal.com | Cal.com, Inc. | **AGPL-3.0** + Proprietary `/ee` Commercial License | Strong network copyleft + proprietary enterprise scheduling modules | **None (Rejected)** | Rejected AGPL/EE source; clean-room Next.js 16 + Drizzle + PostgreSQL with atomic double-booking overlap prevention & sandbox payment flow. |
| **FinanceOS** | Independent clean-room | N/A | Ali Arshad | Original studio code + MIT/Apache-2.0 npm deps | None | Original | Clean-room Next.js 16 + Drizzle + PostgreSQL SMB financial ERP. |
| **FlowOS** | `@xyflow/react` (React Flow) | https://github.com/xyflow/xyflow | webkid / xyflow | **MIT** | None (Pro examples are separate; core library is MIT) | npm dependency `@xyflow/react` | Visual drag-and-drop canvas paired with clean-room deterministic execution engine & human approval gate. |
| **SourceOS** | Independent clean-room | N/A | Ali Arshad | Original studio code + MIT/Apache-2.0 npm deps | None | Original | Clean-room procurement, RFQ comparison, shipment tracking & persisted landed-cost calculator. |
| **Orexa (Demo)** | Independent learning OS demo | N/A | Ali Arshad | Original studio demo code + MIT/Apache-2.0 deps | Separate private external Orexa repo preserved untouched | Original | Self-contained interactive learning OS demo with deterministic AI tutor & adaptive quizzes. |
| **InsightOS** | `recharts` | https://github.com/recharts/recharts | Recharts Group | **MIT** | None | npm dependency `recharts` | Clean-room CSV ingestion, PostgreSQL row storage, chart builder & OLS linear forecasting. |
| **PeopleOS** | Independent clean-room | N/A | Ali Arshad | Original studio code + MIT/Apache-2.0 npm deps | None | Original | Clean-room HR operations, RBAC PII redaction, atomic leave approval workflow & org chart. |

---

## 2. Shared Runtime & Library Dependencies (Permissive Licenses Verified)

| Package | License | Used Across | Commercial Use Permitted |
| --- | --- | --- | --- |
| `next` (`^16.1.6`) | MIT | All 11 Web SaaS apps + Portfolio | Yes |
| `react` / `react-dom` (`^19.2.3`) | MIT | All 11 Web SaaS apps + Portfolio | Yes |
| `drizzle-orm` (`^0.45.4`) | Apache-2.0 | All 11 SaaS apps | Yes (patched `GHSA-gpj5-g38j-94v9`) |
| `zod` (`^4.6.7`) | MIT | All 11 SaaS apps | Yes (patched `GHSA-mrhx-c7xc-m3w5`) |
| `pg` (`^8.16.3`) | MIT | All 11 SaaS apps | Yes |
| `@electric-sql/pglite` (`^0.3.14`) | Apache-2.0 | Local PostgreSQL dev/testing | Yes |
| `tailwindcss` (`^4.1.14`) | MIT | All 11 SaaS apps | Yes |
| `lucide-react` (`^0.544.0`) | ISC | All 11 SaaS apps | Yes |
| `@xyflow/react` | MIT | FlowOS | Yes |
| `recharts` | MIT | InsightOS | Yes |
| `expo` / `expo-camera` / `react-native` | MIT | StockFlow Mobile | Yes |
