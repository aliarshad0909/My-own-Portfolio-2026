# Adaptive Bitrate & ffmpeg Web Media Budget Planner (`video-rendition-planner`)

> **Status:** Built Runnable Studio Prototype (`project-lab/video-rendition-planner`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Deterministic media-engineering CLI generating aspect-safe even-dimension MP4/WebM encoding plans, ffmpeg command manifests, and page-weight transfer budgets.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/video-rendition-planner
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
