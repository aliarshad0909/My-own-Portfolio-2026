# FinanceOS — Financial Intelligence & Business ERP

Standalone Graphite/Teal SMB Financial ERP built with **Next.js 16**, **TypeScript**, **PostgreSQL**, **Drizzle ORM**, and **Zod** for Ali Arshad Personal Studio.

> **Disclaimer:** FinanceOS is an interactive software demonstration featuring fictional records for **Meridian Digital Commerce LLC**. It does not provide certified public accounting (CPA), tax filing, or regulatory audit assurance.

## Core Modules
- Financial Overview Dashboard (Cash balance, Revenue, Gross/Net Operating Profit, Open AR/AP, Monthly Cash-Flow chart, Budget Utilization)
- Income, Expense, Sales & Purchase Ledger (Multi-currency with explicit user-entered FX conversion to base USD integer cents)
- AR Customer Invoices & AP Vendor Bills (Line items, tax %, Draft → Sent → Paid atomic ledger settlement)
- Customer & Vendor Counterparty Accounts with live AR/AP balance rollups
- Category Budgets vs. Actuals & Multi-Currency Reference Rate Table
- CSV Bank Statement Importer & Interactive Reconciliation Workspace
- Profit & Loss Statement (CSV export) & Immutable Audit Trail

## Local Development & Verification
```bash
cd apps/financeos
npm install
npm run dev          # http://localhost:3030
npm run typecheck
npm run lint
npm test
npm run build
```

Demo Credentials: `cfo@financeos.studio` / `FinanceDemo2026!`
