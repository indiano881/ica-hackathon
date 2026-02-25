# ICA Always-On Checkout — Build Steps

## Status Legend
- [ ] Not started
- [x] Done

---

## Phase 1: Scaffold (DONE)

- [x] Initialize root monorepo (npm workspaces, tsconfig.base.json, .gitignore, git init)
- [x] Scaffold `packages/shared` — TypeScript models, constants, utils
- [x] Scaffold `packages/server` — Python 3.12 + FastAPI + Couchbase SDK (swapped from Node/Express)
- [x] Scaffold `packages/app` — React Native Expo, screens, hooks, components
- [x] Create CLAUDE.md and README.md
- [x] Verify builds: shared compiles, server passes pyright + ruff, app passes tsc

---

## Phase 2: Couchbase Capella Setup

> **Decision**: Using Couchbase Capella (cloud) instead of local Docker.
> Local Docker was attempted but Sync Gateway community images have compatibility
> issues with Couchbase Community Edition. Capella provides managed App Services
> (Sync Gateway) out of the box, which is faster for development.

- [ ] Create Couchbase Capella account (free tier) at https://cloud.couchbase.com
- [ ] Create a cluster and `ica-checkout` bucket
- [ ] Create primary index and secondary indexes (type+store_id, type+user_id)
- [ ] Get connection string, create database credentials
- [ ] Configure `packages/server/.env` with Capella credentials
- [ ] Run `seed.py` to populate 8 sample ICA products
- [ ] Verify: `GET /api/products?store_id=store_042` returns seeded products

## Phase 3: Capella App Services (Sync Gateway)

- [ ] Enable App Services on the Capella cluster
- [ ] Configure sync function with channel routing:
  - Products → `store_{store_id}_products` (server-writes only)
  - User docs → `user_{user_id}` (read/write)
  - Promos → `global_promos` (read-only on device)
- [ ] Create App Services user/credentials for the mobile app
- [ ] Update `packages/app/src/db/sync.ts` with Capella App Services endpoint URL
- [ ] Verify: products sync from Capella → Couchbase Lite on device

## Phase 4: Core Mobile Flows

### 4a. Login / User Profile
- [ ] HomeScreen: connect login to Sync Gateway auth (not just local user creation)
- [ ] Fetch user profile from Couchbase Lite after sync
- [ ] Display real loyalty tier and points balance
- [ ] Handle "user not found" — create new user on server, sync back

### 4b. Product Scanning
- [ ] ScanScreen: verify barcode scanner works on physical device (EAN-13 / EAN-8)
- [ ] Look up scanned EAN in local Couchbase Lite product catalog
- [ ] Show product name + price on scan, auto-add to cart
- [ ] Handle unknown barcode gracefully (product not in catalog)

### 4c. Cart Management
- [ ] CartScreen: pull cart from Couchbase Lite (persist across app restarts)
- [ ] Increment/decrement quantity updates line totals and cart totals
- [ ] Remove item removes from cart and recalculates
- [ ] Price locked at scan time (never re-fetched)

### 4d. Checkout / Payment
- [ ] CheckoutScreen: detect online vs offline
- [ ] Online path: check for valid pre-auth token, capture payment
- [ ] Offline path: use pre-auth token if available, fallback to loyalty balance
- [ ] Create Transaction document in Couchbase Lite
- [ ] Create PointsDelta document (append-only, +points for purchase)
- [ ] Mark cart as `checked_out`
- [ ] Navigate to ReceiptScreen

### 4e. Receipt
- [ ] ReceiptScreen: load transaction from Couchbase Lite
- [ ] Show itemized receipt with totals, payment method, points earned
- [ ] Show offline indicator if transaction hasn't synced yet
- [ ] "Return Items" button navigates to ReturnScreen

### 4f. Returns
- [ ] ReturnScreen: select items from original transaction to return
- [ ] Offline return → refund via loyalty credit only
- [ ] Online return → allow card refund option
- [ ] Create ReturnRequest document in Couchbase Lite
- [ ] Create negative PointsDelta document

## Phase 5: Server-Side Processing

- [ ] Transaction settlement: when synced transactions arrive, capture payment via mock service
- [ ] Points aggregation: `GET /api/users/:id/points` sums all applied deltas
- [ ] Update user `points_balance` on the user document after aggregation
- [ ] Return approval flow: `POST /api/returns/:id/approve` processes refund
- [ ] Return rejection flow: `POST /api/returns/:id/reject`
- [ ] Inventory decrement on settled transactions (log-only for hackathon)

## Phase 6: Offline Resilience Testing

- [ ] Test: scan products, checkout, earn points — all while airplane mode is ON
- [ ] Test: re-enable connectivity, verify transaction syncs to Capella
- [ ] Test: server settles the transaction, points delta applied
- [ ] Test: offline return creates loyalty credit, syncs on reconnect
- [ ] Test: duplicate transaction prevention (kill app mid-checkout, reopen)
- [ ] Test: product catalog available offline after initial sync

## Phase 7: Admin Dashboard (stretch goal)

- [ ] Simple React web app (can be a separate page served by FastAPI or standalone)
- [ ] View all transactions for a store
- [ ] View/approve/reject pending returns
- [ ] View product catalog, update stock status
- [ ] View user loyalty info and points history

## Phase 8: Polish & Demo Prep

- [ ] SyncStatusBadge shows real-time online/offline/syncing state
- [ ] Error handling: network failures, Couchbase Lite errors, invalid barcodes
- [ ] Loading states for all async operations
- [ ] ICA branding: red (#E3000B) theme, proper typography
- [ ] Demo script: login → scan 3 products → checkout offline → show receipt → reconnect → verify on server → return 1 item
