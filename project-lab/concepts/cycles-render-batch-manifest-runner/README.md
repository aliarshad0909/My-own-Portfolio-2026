# Blender Cycles Headless Render Queue & Cost Estimator — Representative Concept Workflow (`cycles-render-batch-manifest-runner`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Blender Cycles Headless Render Queue & Cost Estimator** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

3D render jobs stall halfway when missing textures, broken frame ranges, or sample overruns go unchecked until rendering starts.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/cycles-render-batch-manifest-runner
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
