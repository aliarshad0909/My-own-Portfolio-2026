# GPU Inference & Render Batch Scheduling Planner (`gpu-batch-cost-estimator`)

> **Status:** Built Runnable Studio Prototype (`project-lab/gpu-batch-cost-estimator`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Workload-sizing CLI estimating quantized model VRAM footprint, Blender frame-batch duration, and transparent cost comparisons across burst rental vs. dedicated hourly windows.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/gpu-batch-cost-estimator
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
