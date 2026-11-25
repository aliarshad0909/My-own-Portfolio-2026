# LLM Prompt & Retrieval Regression Evaluator (`agent-eval-harness`)

> **Status:** Built Runnable Studio Prototype (`project-lab/agent-eval-harness`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Runnable evaluation runner comparing golden policy queries against candidate prompt/retrieval outputs with deterministic rubric scoring, abstention checks, and regression diffs.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/agent-eval-harness
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
