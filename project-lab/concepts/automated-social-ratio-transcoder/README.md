# Multi-Ratio Social Ad Transcoding & Safe-Zone Pipeline — Representative Concept Workflow (`automated-social-ratio-transcoder`)

> **Honest Scope Disclosure (Concept):** This folder provides a lightweight, locally runnable representative workflow prototype for the **Multi-Ratio Social Ad Transcoding & Safe-Zone Pipeline** concept in the portfolio. It demonstrates the core validation and stage flow using synthetic data and is **not** a finished production application or client deployment.

## Problem Context

Editors lose hours manually re-exporting and checking bitrate/aspect constraints for Reels, Shorts, LinkedIn, and web hero slots.

## Prerequisites

- Node.js 20+ (zero external npm packages required).

## Setup, Run & Test

```bash
cd project-lab/concepts/automated-social-ratio-transcoder
cp .env.example .env   # optional placeholder config
node index.mjs
node --test test.mjs
```

## Teardown

No background services or databases are started; delete any local `.env` file if created.
