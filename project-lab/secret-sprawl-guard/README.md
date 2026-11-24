# Pre-Commit Secret & Credential Leak Scanner (`secret-sprawl-guard`)

> **Status:** Built Runnable Studio Prototype (`project-lab/secret-sprawl-guard`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Fast local repository scanner combining provider-prefix regex rules and Shannon entropy analysis to flag leaked API keys, private keys, and tokens with inline allowlist support.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/secret-sprawl-guard
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
