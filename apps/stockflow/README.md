# StockFlow — Inventory Management & Business Operations SaaS

> **Original Studio Demonstration** built by Ali Arshad Personal Studio (`https://www.aliarshad.co`).

StockFlow is a multi-warehouse inventory and operations platform powered by PostgreSQL + Drizzle ORM, exposing a shared versioned REST API (`/api/v1/*`) used by both the **StockFlow Web Operations Dashboard** and the **StockFlow React Native Expo Mobile Companion App**.

## Open-Source Foundation & Attribution

- **Inventory Domain Model Foundation:** [InvenTree](https://github.com/inventree/InvenTree) — **MIT License** (Copyright 2017–InvenTree Developers).
- **Runtime & Stack:** Next.js 16 (MIT), React 19 (MIT), TypeScript (Apache-2.0), Tailwind CSS v4 (MIT), Drizzle ORM (Apache-2.0), `pg` (MIT), `@electric-sql/pglite` (Apache-2.0), Zod (MIT), Lucide Icons (ISC).
- See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## Controlled Demo Credentials (Web & Mobile)

- **Email:** `ops@stockflow.studio`
- **Password:** `StockFlowDemo2026!`

## Shared Versioned REST API (`/api/v1/*`)

Supports both HTTP-only session cookies (Web) and `Authorization: Bearer <token>` (StockFlow Expo Mobile):

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/v1/health` | `GET` | Database connectivity & inventory counts |
| `/api/v1/auth/login` | `POST` | Authenticate Web or Mobile (`{ demo: true, clientType: "mobile" }` returns Bearer token) |
| `/api/v1/auth/logout` | `POST` | Revoke session token |
| `/api/v1/auth/me` | `GET` | Active authenticated operator |
| `/api/v1/dashboard` | `GET` | Inventory valuation, units on hand, low-stock list, warehouse distribution & recent movements |
| `/api/v1/products` | `GET`, `POST` | Search/filter SKUs, exact barcode lookup (`?barcode=...`), create product |
| `/api/v1/products/[id]` | `GET`, `PATCH`, `DELETE` | Product details + warehouse levels + movement history, update & delete |
| `/api/v1/warehouses` | `GET`, `POST` | Multi-warehouse list with SKU counts & valuation; create warehouse |
| `/api/v1/stock/adjust` | `POST` | Atomic receipt, cycle-count adjustment, or issue (`source: "web" | "mobile"`) |
| `/api/v1/stock/transfer` | `POST` | Atomic inter-warehouse stock transfer with available-stock guard |
| `/api/v1/suppliers` | `GET`, `POST` | Supplier directory |
| `/api/v1/purchase-orders` | `GET`, `POST` | Purchase orders & line items |
| `/api/v1/purchase-orders/[id]/receive` | `POST` | Atomically receive PO lines into warehouse stock & audit trail |
| `/api/v1/customers` | `GET`, `POST` | Customer directory |
| `/api/v1/sales-orders` | `GET`, `POST` | Sales orders & line items |
| `/api/v1/sales-orders/[id]/action` | `POST` | `reserve`, `fulfil`, `ship` (with carrier/tracking), or `cancel` |
| `/api/v1/movements` | `GET` | Filterable inventory audit trail (by type & web/mobile source) |
| `/api/v1/alerts` | `GET` | Low-stock threshold alerts & pending PO/SO notifications |
| `/api/v1/demo/reset` | `POST` | Rate-limited transactional demo reset |

