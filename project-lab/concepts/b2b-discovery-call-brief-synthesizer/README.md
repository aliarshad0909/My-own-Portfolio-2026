# Pre-Call Discovery Brief & CRM Context Prepper — Representative Concept Workflow (`b2b-discovery-call-brief-synthesizer`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Pre-Call Discovery Brief & CRM Context Prepper** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Founders and account executives jump onto discovery calls scrambling across old emails, intake forms, and CRM notes.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/b2b-discovery-call-brief-synthesizer
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
