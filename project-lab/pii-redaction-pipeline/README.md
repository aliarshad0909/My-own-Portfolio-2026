# Deterministic PII Scrubbing & Tokenization Proxy (`pii-redaction-pipeline`)

> **Status:** Built Runnable Studio Prototype (`project-lab/pii-redaction-pipeline`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Pre-LLM and pre-logging text sanitizer detecting emails, phone numbers, SSNs, and Luhn-validated payment card numbers, replacing them with reversible session placeholders.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/pii-redaction-pipeline
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
