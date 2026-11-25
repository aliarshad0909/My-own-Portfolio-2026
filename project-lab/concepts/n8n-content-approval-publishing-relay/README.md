# Approval-Gated Content & Asset Publishing Relay — Representative Concept Workflow (`n8n-content-approval-publishing-relay`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Approval-Gated Content & Asset Publishing Relay** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Marketing coordinators waste hours manually copying finalized captions, UTM links, and cropped assets between planning sheets and schedulers.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-content-approval-publishing-relay
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
