# ICA Always-On Checkout — Project Scaffold Plan

## Context

Hackathon project for ICA supermarkets: an "always-on checkout" system using Couchbase. Customers can scan products, pay, earn loyalty points, and initiate returns — even when offline. Couchbase Lite on-device syncs to Couchbase Capella (cloud) via Sync Gateway when connectivity returns.

## Tech Stack

- **Mobile App**: React Native (Expo) + TypeScript + Couchbase Lite (via `cbl-reactnative`)
- **Backend API**: Node.js + Express + TypeScript + Couchbase Node.js SDK
- **Admin Dashboard**: Simple React web app (served by Express or standalone)
- **Database**: Couchbase Capella (cloud) + App Services (managed Sync Gateway)
- **Shared**: TypeScript types/interfaces for document models

## Monorepo Structure

```
ica-couchbase/
├── package.json              # Root workspace config (npm workspaces)
├── tsconfig.base.json        # Shared TS config
├── .gitignore
├── CLAUDE.md
├── README.md
│
├── packages/
│   ├── shared/               # Shared types & constants
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── models/
│   │       │   ├── product.ts        # Product document type
│   │       │   ├── user.ts           # User profile type
│   │       │   ├── cart.ts           # Cart document type
│   │       │   ├── transaction.ts    # Transaction document type
│   │       │   ├── points-delta.ts   # Points delta type
│   │       │   └── return-request.ts # Return request type
│   │       ├── constants.ts          # Doc type prefixes, channels, status enums
│   │       └── utils.ts              # ID generators (UUID), price calc helpers
│   │
│   ├── server/               # Express API + admin endpoints
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts              # Express app entry
│   │       ├── config.ts             # Couchbase Capella connection config (env vars)
│   │       ├── db.ts                 # Couchbase cluster/bucket/collection setup
│   │       ├── routes/
│   │       │   ├── products.ts       # CRUD products, seed catalog
│   │       │   ├── transactions.ts   # View/validate synced transactions
│   │       │   ├── users.ts          # User/loyalty management
│   │       │   └── returns.ts        # Process return requests
│   │       └── services/
│   │           ├── payment.ts        # Payment capture/settlement logic (mock)
│   │           ├── points.ts         # Points aggregation from deltas
│   │           └── inventory.ts      # Stock management
│   │
│   └── app/                  # React Native (Expo) mobile app
│       ├── package.json
│       ├── tsconfig.json
│       ├── app.json              # Expo config
│       └── src/
│           ├── App.tsx
│           ├── db/
│           │   ├── couchbase.ts      # Couchbase Lite init, replication config
│           │   └── sync.ts           # Sync Gateway connection, channel subscriptions
│           ├── screens/
│           │   ├── HomeScreen.tsx         # Entry, login/loyalty scan
│           │   ├── ScanScreen.tsx         # Barcode scanner + cart
│           │   ├── CartScreen.tsx         # Review cart, totals
│           │   ├── CheckoutScreen.tsx     # Payment flow (online/offline)
│           │   ├── ReceiptScreen.tsx      # Receipt + points earned
│           │   └── ReturnScreen.tsx       # Initiate return from past receipt
│           ├── components/
│           │   ├── ProductCard.tsx
│           │   ├── CartItem.tsx
│           │   ├── SyncStatusBadge.tsx   # Shows online/offline/syncing state
│           │   └── PointsDisplay.tsx
│           ├── hooks/
│           │   ├── useCart.ts            # Cart CRUD against Couchbase Lite
│           │   ├── useProducts.ts        # Query local product catalog
│           │   ├── useSync.ts            # Monitor replication status
│           │   └── useAuth.ts            # User session (cached locally)
│           └── utils/
│               └── connectivity.ts       # Network state listener
```

## Document Models

### Product (server → device, read-only on device)
```json
{
  "type": "product",
  "ean": "7310865085880",
  "name": "ICA Kvarnmjöl",
  "brand": "ICA",
  "category": "flour",
  "price": 24.90,
  "currency": "SEK",
  "vat_rate": 12,
  "image_url": "https://cdn.ica.se/images/7310865085880.jpg",
  "store_id": "store_042",
  "in_stock": true,
  "updated_at": "2026-02-25T10:00:00Z"
}
```
**Key**: `product::store_042::7310865085880`

### User Profile (bidirectional sync)
```json
{
  "type": "user",
  "user_id": "usr_a1b2c3",
  "name": "Erik Svensson",
  "email": "erik@example.com",
  "loyalty_tier": "gold",
  "points_balance": 14200,
  "payment_preauth": {
    "token": "tok_xyz789",
    "ceiling_sek": 500,
    "authorized_at": "2026-02-25T08:30:00Z",
    "expires_at": "2026-02-25T12:30:00Z"
  },
  "store_id": "store_042",
  "synced_at": "2026-02-25T09:00:00Z"
}
```
**Key**: `user::usr_a1b2c3`

### Cart (local, syncs on checkout)
```json
{
  "type": "cart",
  "cart_id": "cart_f47ac10b",
  "user_id": "usr_a1b2c3",
  "store_id": "store_042",
  "device_id": "dev_iphone_99",
  "status": "active",
  "items": [
    {
      "ean": "7310865085880",
      "name": "ICA Kvarnmjöl",
      "qty": 2,
      "unit_price": 24.90,
      "line_total": 49.80,
      "scanned_at": "2026-02-25T09:15:00Z"
    }
  ],
  "totals": {
    "items_count": 3,
    "subtotal": 68.30,
    "vat_total": 8.20,
    "total": 68.30
  },
  "created_at": "2026-02-25T09:14:00Z",
  "updated_at": "2026-02-25T09:16:30Z"
}
```
**Key**: `cart::cart_f47ac10b`

### Transaction (created at checkout, syncs to server)
```json
{
  "type": "transaction",
  "txn_id": "txn_8c1e2d3f",
  "cart_id": "cart_f47ac10b",
  "user_id": "usr_a1b2c3",
  "store_id": "store_042",
  "device_id": "dev_iphone_99",
  "items": [],
  "totals": { "subtotal": 68.30, "vat_total": 8.20, "total": 68.30 },
  "payment": {
    "method": "preauth",
    "preauth_token": "tok_xyz789",
    "amount": 68.30,
    "status": "pending_capture",
    "settled_at": null
  },
  "points_earned": 68,
  "offline": true,
  "created_at": "2026-02-25T09:20:00Z",
  "synced_at": null
}
```
**Key**: `txn::txn_8c1e2d3f`

### Points Delta (append-only, conflict-free)
```json
{
  "type": "points_delta",
  "delta_id": "pd_9f8e7d6c",
  "user_id": "usr_a1b2c3",
  "txn_id": "txn_8c1e2d3f",
  "delta": 68,
  "reason": "purchase",
  "store_id": "store_042",
  "status": "pending",
  "created_at": "2026-02-25T09:20:00Z"
}
```
**Key**: `points_delta::pd_9f8e7d6c`

### Return Request (created on device, resolved on server)
```json
{
  "type": "return_request",
  "return_id": "ret_5a4b3c2d",
  "user_id": "usr_a1b2c3",
  "store_id": "store_042",
  "original_txn_id": "txn_8c1e2d3f",
  "items": [
    { "ean": "7310865085880", "qty": 1, "unit_price": 24.90, "reason": "damaged" }
  ],
  "refund": {
    "amount": 24.90,
    "method": "loyalty_credit",
    "status": "pending"
  },
  "points_delta": -25,
  "offline": true,
  "created_at": "2026-02-25T10:00:00Z"
}
```
**Key**: `return_request::ret_5a4b3c2d`

## Sync Gateway Channel Design

```
store_{id}_products   ← product catalog (read-only on device)
user_{user_id}        ← user profile, carts, transactions, points, returns
global_promos         ← promotions (read-only on device)
```

## Steps to Scaffold

### 1. Initialize root monorepo
- `npm init` at root
- Configure npm workspaces: `["packages/*"]`
- Create `tsconfig.base.json` with shared TS settings
- Create `.gitignore`
- `git init`

### 2. Scaffold `packages/shared`
- TypeScript interfaces for all 6 document models
- Constants: document type prefixes, status enums, channel name generators
- Utility: UUID generator, price/VAT calculator

### 3. Scaffold `packages/server`
- Dependencies: express, couchbase, cors, dotenv, uuid, typescript, ts-node
- Express app with routes for products, transactions, users, returns
- Couchbase connection module (env vars)
- Mock payment service
- Seed script for product catalog (sample ICA products)
- `.env.example`

### 4. Scaffold `packages/app`
- Create Expo app: `npx create-expo-app`
- Add: cbl-reactnative, expo-camera, react-navigation
- Couchbase Lite init module
- Screen stubs with navigation
- Sync status hook + cart hook

### 5. Create CLAUDE.md and README.md

## Verification

1. `npm install` at root installs all workspace deps
2. `npm run build -w packages/shared` compiles shared types
3. `npm run dev -w packages/server` starts Express server
4. `cd packages/app && npx expo start` launches mobile app
5. Shared types importable from both server and app

## Key Offline Patterns

- **Payments**: Pre-auth while online, capture offline. Fallback to loyalty balance.
- **Points**: Append-only deltas, never mutate a counter. Server aggregates on sync.
- **Returns**: Offline returns give loyalty credit only. Card refunds require server.
- **Prices**: Captured at scan time — customer pays what they saw.
- **Dedup**: Client-generated UUIDs as document keys prevent duplicate transactions.
- **Conflict resolution**: Product docs use server-wins. Transaction/points docs are append-only (no conflicts).
