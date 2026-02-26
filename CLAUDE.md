# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ICA Always-On Checkout — a hackathon project for ICA supermarkets. An offline-capable self-checkout system where customers scan products, pay, earn loyalty points, and initiate returns even without connectivity. Couchbase Lite on-device syncs to Couchbase Capella (cloud) via Sync Gateway when online.

## Monorepo Structure

Mixed monorepo: npm workspaces for TypeScript packages, Python venv for the server. The server is **not** in the npm workspace — it has its own Python venv at `packages/server/.venv`.

- **packages/shared** (`@ica/shared`) — TypeScript interfaces for all document models, constants (doc type prefixes, status enums, channel names), utility functions (UUID generation, price/VAT calculation). Consumed by the mobile app. Built output in `dist/` must exist before the app can run.
- **packages/server** — Python 3.12 + FastAPI + Couchbase Python SDK. Pydantic models mirror the shared TS types. Routes: products, transactions, users, returns. Services: payment (mock), points aggregation, inventory.
- **packages/app** — React Native (Expo) mobile app. Uses `cbl-reactnative` for Couchbase Lite. Screens: Home, Scan, Cart, Checkout, Receipt, Return. Hooks for cart, products, sync status, auth.

## Build & Dev Commands

```bash
# TypeScript shared types (must build before running app)
npm install                              # Install npm workspace deps from root
npm run build:shared                     # Compile shared types → packages/shared/dist/

# Python server
cd packages/server
python3.12 -m venv .venv                # Create venv (first time)
.venv/bin/pip install -e ".[dev]"        # Install deps (first time)
.venv/bin/uvicorn app.main:app --reload --port 3000   # Start dev server
.venv/bin/python seed.py                 # Seed 8 demo products into store_042

# Mobile app
cd packages/app && npx expo start        # Launch Expo mobile app
```

**No test infrastructure exists.** No Jest, pytest, or CI pipeline. This is a hackathon scaffold.

## Server Development (packages/server)

- Python 3.12, FastAPI, Pydantic v2, Couchbase Python SDK
- Entry point: `app/main.py` — lifespan hook calls `connect_db()`, CORS is open (`*`)
- Pydantic models in `app/models/` — must stay in sync with `packages/shared` TS types
- DB singleton in `app/db.py` — `get_collection()` returns the default collection
- Key builders in `app/constants.py` — mirror `DocKey` / `Channel` from shared package
- Linting: `.venv/bin/ruff check app/`
- Type checking: `.venv/bin/pyright app/` (couchbase SDK warnings are expected — no type stubs)
- FastAPI auto-docs available at `/docs` (Swagger) and `/redoc`

### Server API Endpoints

| Route prefix | Key endpoints |
|---|---|
| `/api/products` | `GET /` (`?store_id=`), `GET /{store_id}/{ean}`, `PUT /{store_id}/{ean}`, `DELETE /{store_id}/{ean}` |
| `/api/transactions` | `GET /` (`?user_id=`), `GET /{txn_id}`, `POST /{txn_id}/settle` |
| `/api/users` | `GET /{user_id}`, `PUT /{user_id}`, `GET /{user_id}/points` |
| `/api/returns` | `GET /` (`?user_id=`), `POST /{return_id}/approve`, `POST /{return_id}/reject` |
| `/health` | Health check |

### Transaction Settle Flow (key server-side workflow)

`POST /api/transactions/{txn_id}/settle` → fetch txn → guard if already captured → `capture_payment()` → replace doc with `status="captured"` + `settled_at` → `apply_points_delta()` creates a `points_delta` doc.

## The `type` Field Is Load-Bearing

Every document has a `type` literal string (`"product"`, `"user"`, `"cart"`, `"transaction"`, `"points_delta"`, `"return_request"`). It drives:
- N1QL `WHERE type = 'x'` queries on the server
- Sync Gateway channel routing (`infra/sync-gateway-config.json`)
- Pydantic model discrimination

Never omit it from any document.

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

Channel routing is based on the `type` field — see `infra/sync-gateway-config.json` for the sync function. For Capella App Services, this same logic is configured via the Capella web UI.

## Critical Offline Architecture Patterns

These patterns are fundamental to the system design — do not deviate:

1. **Payments**: Pre-auth token obtained while online; capture happens offline against the token. Fallback to loyalty point balance if no pre-auth available. Pre-auth validity check is client-side only (`CheckoutScreen.tsx`).
2. **Points**: Append-only delta documents — never mutate a counter. Server aggregates all `points_delta` docs via N1QL `SUM` query (`services/points.py`). The `points_balance` on the user doc is client-side cache only — never trust it server-side.
3. **Returns**: Offline returns credit loyalty points only. Card refunds require server connectivity.
4. **Price capture**: Prices are locked at scan time — the customer pays what was displayed when they scanned.
5. **Deduplication**: Client-generated UUIDs as Couchbase document keys prevent duplicate transactions on re-sync.
6. **Conflict resolution**: Product documents use server-wins. Transaction and points delta documents are append-only (inherently conflict-free).

## Mobile App Architecture (packages/app)

Navigation: React Navigation native stack. Flow: Home → Scan → Cart → Checkout → Receipt → Return.

Key layers:
- **Screens** (`src/screens/`) — UI + business logic (checkout payment decision in `CheckoutScreen.tsx`)
- **Contexts** (`src/contexts/`) — `AuthContext` and `CartContext` provide global state; wrapped at `App.tsx` root
- **Hooks** (`src/hooks/`) — `useAuth`, `useCart` are thin re-exports from contexts. `useProducts`, `useSync` are standalone hooks.
- **DB layer** (`src/db/`) — `couchbase.ts` (singleton database `"ica-checkout"`) and `sync.ts` (continuous bidirectional replication)
- **Theme** (`src/theme.ts`) — Central design tokens: `Colors` (primary `#cf2005` ICA red), `Typography` (IcaTextNy font), `Spacing`, `Radius`. All screens use these — do not hardcode colors.
- **Connectivity** (`src/utils/connectivity.ts`) — `isConnected()` and `onConnectivityChange()` via `@react-native-community/netinfo`

### State Management: React Context (not hooks alone)

Cart and auth state are managed via React Context, not per-screen hooks. This was a deliberate fix — using standalone hooks caused a bug where cart state was `null` after navigating between screens.

- **AuthContext** (`src/contexts/AuthContext.tsx`) — manages `user` state, `login(userId)`, `logout()`
- **CartContext** (`src/contexts/CartContext.tsx`) — manages `cart` state, `initCart(userId, storeId)` (idempotent), `addItem`, `removeItem`, `updateItemQty`, `clearCart`. Persists to Couchbase Lite on every mutation.
- Both wrapped at root in `App.tsx`: `<AuthProvider><CartProvider>...</CartProvider></AuthProvider>`

### EAS Build & Couchbase Maven Plugin

The app uses EAS Build (`eas.json`) for native builds. A custom Expo config plugin (`plugins/with-couchbase-maven.js`) injects the Couchbase private Maven repository (`https://mobile.maven.couchbase.com/maven2/dev/`) into Android's `settings.gradle` and `build.gradle` at prebuild time. This is required for the `cbl-reactnative` Android native module to resolve its dependencies.

## Known Stubs and Hardcoded Values

- `store_042` — hardcoded demo store ID in `HomeScreen.tsx`, `useAuth.ts`, and `seed.py`
- `device_local` — hardcoded device ID throughout the app (not yet implemented)
- `SYNC_GATEWAY_URL` in `db/sync.ts` is a placeholder (`wss://your-sync-gateway.example.com:4984/ica-checkout`) — must be updated for real deployment
- Authentication is a stub — loyalty card number is used as username with hardcoded `"password"`
- Payment service (`services/payment.py`) is mock-only — always returns `"captured"` / `"processed"`

## Infrastructure

Using **Couchbase Capella** (cloud) for both the database and App Services (managed Sync Gateway). Local Docker (`docker-compose.yml` + `infra/`) was evaluated but dropped due to Sync Gateway compatibility issues with Community Edition.

The `infra/init-couchbase.sh` script documents the required Couchbase indexes: primary index, `idx_type_store (type, store_id)`, and `idx_type_user (type, user_id)`. These must exist in Capella.

## Environment Variables (packages/server)

Couchbase Capella connection configured via env vars. Copy `packages/server/.env.example` to `.env`:
- `COUCHBASE_CONNECTION_STRING` — Capella connection string (starts with `couchbases://`)
- `COUCHBASE_USERNAME` — database credentials (not Capella account credentials)
- `COUCHBASE_PASSWORD`
- `COUCHBASE_BUCKET` — `ica-checkout`
- `PORT`

## TypeScript Conventions (packages/shared, packages/app)

- All shared types/interfaces live in `packages/shared` — never duplicate model definitions in the app
- All TS packages extend from `tsconfig.base.json` at the root
- The `cbl-reactnative` SDK uses factory methods and setter APIs (e.g., `Replicator.create()`, `config.setContinuous()`, `new MutableDocument(id)` with `setData()`)
