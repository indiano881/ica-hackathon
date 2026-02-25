# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ICA Always-On Checkout — a hackathon project for ICA supermarkets. An offline-capable self-checkout system where customers scan products, pay, earn loyalty points, and initiate returns even without connectivity. Couchbase Lite on-device syncs to Couchbase Capella (cloud) via Sync Gateway when online.

## Monorepo Structure

Mixed monorepo: npm workspaces for TypeScript packages, Python venv for the server.

- **packages/shared** — TypeScript interfaces for all document models, constants (doc type prefixes, status enums, channel names), utility functions (UUID generation, price/VAT calculation). Consumed by the mobile app.
- **packages/server** — Python 3.12 + FastAPI + Couchbase Python SDK. Pydantic models mirror the shared TS types. Routes: products, transactions, users, returns. Services: payment (mock), points aggregation, inventory.
- **packages/app** — React Native (Expo) mobile app. Uses `cbl-reactnative` for Couchbase Lite. Screens: Home, Scan, Cart, Checkout, Receipt, Return. Hooks for cart, products, sync status, auth.

## Build & Dev Commands

```bash
# TypeScript shared types (must build before running app)
npm install                              # Install npm workspace deps from root
npm run build:shared                     # Compile shared types

# Python server
cd packages/server
python3.12 -m venv .venv                # Create venv (first time)
.venv/bin/pip install -e ".[dev]"        # Install deps (first time)
.venv/bin/uvicorn app.main:app --reload --port 3000   # Start dev server
.venv/bin/python seed.py                 # Seed product catalog

# Mobile app
cd packages/app && npx expo start        # Launch Expo mobile app
```

## Server Development (packages/server)

- Python 3.12, FastAPI, Pydantic v2, Couchbase Python SDK
- Entry point: `app/main.py`
- Pydantic models in `app/models/` — must stay in sync with `packages/shared` TS types
- Linting: `.venv/bin/ruff check app/`
- Type checking: `.venv/bin/pyright app/` (couchbase SDK warnings are expected — no type stubs)
- FastAPI auto-docs available at `/docs` (Swagger) and `/redoc`

## Couchbase Document Key Conventions

All document keys use `type::id` format with consistent prefixes:

| Document       | Key Pattern                          | Sync Direction        |
|----------------|--------------------------------------|-----------------------|
| Product        | `product::{store_id}::{ean}`         | Server → Device (read-only) |
| User           | `user::{user_id}`                    | Bidirectional         |
| Cart           | `cart::{cart_id}`                    | Local, syncs on checkout |
| Transaction    | `txn::{txn_id}`                      | Device → Server       |
| Points Delta   | `points_delta::{delta_id}`           | Device → Server       |
| Return Request | `return_request::{return_id}`        | Device → Server       |

## Sync Gateway Channels

- `store_{id}_products` — product catalog (read-only on device)
- `user_{user_id}` — user profile, carts, transactions, points, returns (read/write)
- `global_promos` — promotions (read-only on device)

## Critical Offline Architecture Patterns

These patterns are fundamental to the system design — do not deviate:

1. **Payments**: Pre-auth token obtained while online; capture happens offline against the token. Fallback to loyalty point balance if no pre-auth available.
2. **Points**: Append-only delta documents — never mutate a counter. Server aggregates all `points_delta` docs on sync.
3. **Returns**: Offline returns credit loyalty points only. Card refunds require server connectivity.
4. **Price capture**: Prices are locked at scan time — the customer pays what was displayed when they scanned.
5. **Deduplication**: Client-generated UUIDs as Couchbase document keys prevent duplicate transactions on re-sync.
6. **Conflict resolution**: Product documents use server-wins. Transaction and points delta documents are append-only (inherently conflict-free).

## Environment Variables (packages/server)

Couchbase Capella connection configured via env vars. See `.env.example`:
- `COUCHBASE_CONNECTION_STRING`
- `COUCHBASE_USERNAME`
- `COUCHBASE_PASSWORD`
- `COUCHBASE_BUCKET`
- `PORT`

## TypeScript Conventions (packages/shared, packages/app)

- All shared types/interfaces live in `packages/shared` — never duplicate model definitions in the app
- All TS packages extend from `tsconfig.base.json` at the root
- The `cbl-reactnative` SDK uses factory methods and setter APIs (e.g., `Replicator.create()`, `config.setContinuous()`, `new MutableDocument(id)` with `setData()`)
