# OpenAPI Breaking-Change & Schema Contract Diff CLI (`api-contract-diff`)

> **Status:** Built Runnable Studio Prototype (`project-lab/api-contract-diff`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Contract verification CLI comparing baseline and candidate OpenAPI JSON specifications to flag removed endpoints, newly required inputs, and narrowed response types.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/api-contract-diff
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
