# MCP Least-Privilege Tool Policy Gateway (`mcp-policy-gateway`)

> **Status:** Built Runnable Studio Prototype (`project-lab/mcp-policy-gateway`) — verified locally using synthetic demo data. Not a paid client deployment.

## Overview

Policy proxy validating Model Context Protocol (MCP) JSON-RPC tool invocations against role allowlists, strict argument schemas, and human-approval gates for mutating actions.

## Prerequisites

- Node.js 20+ (uses pure ESM standard library; zero extra packages needed).

## Setup

```bash
cd project-lab/mcp-policy-gateway
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
