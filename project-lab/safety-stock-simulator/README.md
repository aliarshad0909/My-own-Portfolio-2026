# Monte Carlo Safety Stock & Lead-Time Variability Simulator (`safety-stock-simulator`)

> **Status:** Built Runnable Studio Prototype (`project-lab/safety-stock-simulator`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Seeded stochastic inventory simulator modeling simultaneous demand spikes and supplier lead-time delays to recommend empirical reorder points at 95%–99% service levels.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/safety-stock-simulator
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
