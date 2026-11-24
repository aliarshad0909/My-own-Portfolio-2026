# Multi-Location Gross Margin & Cost Console — Representative Concept Workflow (`multi-branch-margin-visibility-console`)

> **Honest Scope Disclosure (Sample Scenario):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Multi-Location Gross Margin & Cost Console** sample scenario in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Regional operators see top-line revenue growth while quiet shipping and discount creep erode net contribution margin at specific branches.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/multi-branch-margin-visibility-console
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
