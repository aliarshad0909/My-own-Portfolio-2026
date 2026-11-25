# AI Token & Multi-Model FinOps Attribution Engine (`llm-finops-meter`)

> **Status:** Built Runnable Studio Prototype (`project-lab/llm-finops-meter`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Integer-microdollar token cost ledger attributing multi-provider LLM usage across tenants, features, and workflows with soft/hard budget anomaly alerts.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/llm-finops-meter
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
