# Internal SOP & Warehouse Handbook Copilot — Representative Concept Workflow (`sop-operations-handbook-copilot`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Internal SOP & Warehouse Handbook Copilot** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

New hires struggle to locate specific packing, safety, or escalation procedures buried across 80-page internal handbooks.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/sop-operations-handbook-copilot
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
