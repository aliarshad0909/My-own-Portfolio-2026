# Parametric 3D Packaging & Colourway Turntable Spec — Representative Concept Workflow (`parametric-packaging-turntable-rig`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Parametric 3D Packaging & Colourway Turntable Spec** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Photographing 18 color variants of the same hardware or cosmetic bottle under identical studio lighting is slow and costly.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/parametric-packaging-turntable-rig
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
