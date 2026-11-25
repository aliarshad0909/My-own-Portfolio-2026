# Google Workspace Project Kickoff Provisioner — Representative Concept Workflow (`n8n-google-workspace-client-kickoff`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Google Workspace Project Kickoff Provisioner** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Account managers spend 45 minutes per new client manually duplicating Drive folders, setting permissions, and copying kickoff templates.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/n8n-google-workspace-client-kickoff
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
