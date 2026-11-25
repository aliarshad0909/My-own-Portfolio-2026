# RFP & Security Questionnaire Clause Assistant — Representative Concept Workflow (`rfp-compliance-clause-triage-agent`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **RFP & Security Questionnaire Clause Assistant** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Sales engineers burn hours copying recurring answers into vendor questionnaires while risking accidental over-promising.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/rfp-compliance-clause-triage-agent
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
