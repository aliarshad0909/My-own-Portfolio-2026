# Multi-Channel Ecommerce SKU & Feed Validator (`catalog-feed-normalizer`)

> **Status:** Built Runnable Studio Prototype (`project-lab/catalog-feed-normalizer`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Catalog normalization pipeline transforming messy vendor SKU exports into validated Google Merchant and storefront-ready records with EAN-13 checksum verification.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/catalog-feed-normalizer
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
