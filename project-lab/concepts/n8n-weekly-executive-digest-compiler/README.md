# Automated Monday Executive Metrics Digest — Representative Concept Workflow (`n8n-weekly-executive-digest-compiler`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Automated Monday Executive Metrics Digest** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Leadership teams click through six separate SaaS dashboards every Monday just to answer whether the week is on track.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-weekly-executive-digest-compiler
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
