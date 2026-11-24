# Zero-Downtime PostgreSQL Migration Safety Linter (`schema-migration-linter`)

> **Status:** Built Runnable Studio Prototype (`project-lab/schema-migration-linter`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Static SQL DDL analyzer catching table-locking PostgreSQL migration hazards—like non-concurrent index builds, volatile defaults, and unsafe NOT NULL alterations—before production deploys.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/schema-migration-linter
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
