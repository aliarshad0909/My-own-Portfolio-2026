# On-Call SLA Breach Predictor & Escalation Router (`sla-incident-escalation`)

> **Status:** Built Runnable Studio Prototype (`project-lab/sla-incident-escalation`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Deterministic ticket-queue monitor computing elapsed business-hour SLA burn rates, flagging imminent breaches early, and routing escalations across priority tiers.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/sla-incident-escalation
cp .env.example .env   # optional; placeholder defaults work out of the box
```

## Run Local Demo

```bash
node index.mjs
```

## Run Automated Tests

```bash
node --test test.mjs
```

## Teardown

No background processes or external databases are started. Remove any local `.env` file if created.
