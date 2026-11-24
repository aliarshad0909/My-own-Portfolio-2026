# RAG Claim-to-Source Grounding & Citation Auditor (`rag-citation-verifier`)

> **Status:** Built Runnable Studio Prototype (`project-lab/rag-citation-verifier`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Sentence-level verification module checking whether every factual claim and numeric value in a RAG answer is supported by its cited source passages.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/rag-citation-verifier
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
