# Deterministic Cohort & Progressive Rollout Flag Engine (`feature-flag-evaluator`)

> **Status:** Built Runnable Studio Prototype (`project-lab/feature-flag-evaluator`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Lightweight server/edge feature-flag evaluator using FNV-1a consistent hashing for stickier percentage rollouts, attribute targeting rules, and instant kill-switch overrides.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/feature-flag-evaluator
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
