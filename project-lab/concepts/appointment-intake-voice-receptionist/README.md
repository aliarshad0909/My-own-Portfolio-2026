# After-Hours Service Intake Voice Router — Representative Concept Workflow (`appointment-intake-voice-receptionist`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **After-Hours Service Intake Voice Router** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Trades and service firms miss high-intent callers after 5 PM while voicemail boxes sit unlistened until noon the next day.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/appointment-intake-voice-receptionist
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
