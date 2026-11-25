# Ecommerce Returns, Restocking & Margin Recovery Engine (`returns-margin-triage`)

> **Status:** Built Runnable Studio Prototype (`project-lab/returns-margin-triage`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Deterministic returns-decision calculator evaluating item margin, return-shipping cost, and refurbishment labor to recommend exchange credit, restock, or keep-item resolution.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/returns-margin-triage
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
