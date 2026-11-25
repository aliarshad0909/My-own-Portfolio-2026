# Idempotent Webhook Ingestion & Dead-Letter Replay Engine (`webhook-deadletter-replay`)

> **Status:** Built Runnable Studio Prototype (`project-lab/webhook-deadletter-replay`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Webhook reliability prototype combining HMAC-SHA256 signature validation, idempotency-key deduplication, bounded exponential backoff, and dead-letter replay.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/webhook-deadletter-replay
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
