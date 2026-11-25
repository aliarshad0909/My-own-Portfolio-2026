# CSS Design Token Contrast & WCAG 2.2 Gate CLI (`design-token-wcag-auditor`)

> **Status:** Built Runnable Studio Prototype (`project-lab/design-token-wcag-auditor`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Automated accessibility CLI parsing CSS custom-property token files and verifying every configured foreground/background pairing against WCAG 2.2 AA and AAA ratios.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/design-token-wcag-auditor
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
