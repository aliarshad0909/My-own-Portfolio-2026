# Multi-Tier Supplier Certificate & Audit Expiry Tracker (`supplier-compliance-ledger`)

> **Status:** Built Runnable Studio Prototype (`project-lab/supplier-compliance-ledger`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Compliance state engine tracking factory ISO 9001, RoHS, safety, and liability certificates with 90/60/30-day renewal alerts and weighted vendor risk scoring.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/supplier-compliance-ledger
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
