# CRM Deduplication & Form-to-Pipeline Normalizer — Representative Concept Workflow (`n8n-crm-lead-enrichment-dedup-sync`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **CRM Deduplication & Form-to-Pipeline Normalizer** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Duplicate contacts from web forms, webinar imports, and manual entry corrupt sales attribution and cause awkward double-outreach.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-crm-lead-enrichment-dedup-sync
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
