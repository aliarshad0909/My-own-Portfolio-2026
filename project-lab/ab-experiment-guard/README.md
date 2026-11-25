# Sample-Ratio Mismatch (SRM) & A/B Test Guardrail Analyzer (`ab-experiment-guard`)

> **Status:** Built Runnable Studio Prototype (`project-lab/ab-experiment-guard`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Statistical experiment integrity checker running chi-squared Sample-Ratio Mismatch (SRM) tests and two-proportion z-tests with minimum sample-size guards.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/ab-experiment-guard
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
