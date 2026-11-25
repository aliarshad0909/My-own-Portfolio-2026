# PO, Warehouse Receipt & Supplier Invoice 3-Way Match Engine (`invoice-three-way-match`)

> **Status:** Built Runnable Studio Prototype (`project-lab/invoice-three-way-match`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Integer-cent procurement reconciliation engine matching purchase orders, warehouse receiving counts, and vendor invoices against configurable price and quantity tolerances.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/invoice-three-way-match
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
