# Split-Knowledge Offline Payment Architecture

## Overview

A threshold cryptography approach for offline payment authorization where the payment proof requires collaboration between **three parties**: the user's device (Shard A), the store POS (Shard B), and the user's knowledge (PIN). No single party can authorize a payment alone.

## Architecture Decisions

### 1. Shard Combination Location
**Decision:** On Cashier POS

- Device sends partial signature to POS via QR code
- POS combines with its shard to produce full signature
- Device never sees full key (security benefit)
- POS can enforce store-level rules before accepting
- Proof stays on store infrastructure for settlement

### 2. Replay Prevention
**Decision:** Counter/nonce binding

- Each user has a monotonic counter per store
- Counter is included in signature: `sign(txn_hash, counter)`
- POS tracks last-seen counter per user, rejects `counter <= last_seen`
- Shard A remains permanent (no shard exhaustion)

### 3. Multi-Store Counter State
**Decision:** No cross-store offline (first visit requires online)

```
Store A: user_X counter = 47  (established)  → offline OK
Store B: user_X counter = ?   (never seen)   → requires online handshake
```

- Each store maintains independent counter state per user
- First visit to new store requires online to establish counter baseline
- Subsequent visits to that store can be fully offline
- Practical trade-off: most users have regular stores

### 4. Shard Provisioning
**Decision:** Store generates Shard B locally

```
Device:   Shard A  (universal, provisioned once at signup)
Store X:  Shard B_x (generated locally by Store X)
Store Y:  Shard B_y (generated locally by Store Y)
```

- Stores are independent — no shard distribution infrastructure needed
- Compromising one store doesn't affect others
- Device's Shard A = "user identity" factor
- Store's Shard B = "location authorization" factor

### 5. Settlement Verification
**Decision:** Stores upload Shard B commitment to central server

```
Setup (once per store, online):
  Store generates Shard B (secret)
  Store computes commitment = PublicKey(B)
  Store registers commitment with central server

Settlement (online):
  Store sends: (signature, txn, store_id)
  Server looks up commitment for store_id
  Server verifies signature against commitments
```

### 6. User Authentication
**Decision:** PIN as third cryptographic shard

```
Proof = sign_threshold(Shard_A, Shard_B, PIN, counter, txn_hash)

Stolen phone scenario:
  - Thief has Shard A (on device)
  - Thief visits store (Shard B available)
  - Thief doesn't know PIN → invalid partial signature → payment fails
```

- PIN is never stored, only used in cryptographic computation
- Not just app unlock — PIN is mathematically required for valid signature

### 7. Spending Limits
**Decision:** POS enforces store policy

- Each store sets maximum offline transaction amount
- POS rejects if `txn_amount > store_max_offline`
- Simple, user-agnostic, no complex per-user limit state
- Fits with "first visit online" model — store can check user standing during handshake

### 8. Cryptographic Scheme
**Decision:** Threshold Schnorr signatures

```
Distributed Key Generation:
  - Master keypair (sk, pk) never exists in one place
  - Shard A = partial_sk on device (derived with PIN)
  - Shard B = partial_sk on POS
  - pk registered with central server

Threshold Signing (at checkout):
  - Device: partial_sig_A = sign_partial(A, PIN, counter, txn)
  - POS: partial_sig_B = sign_partial(B, counter, txn)
  - Full signature: σ = aggregate(partial_sig_A, partial_sig_B)
  - Verification: verify(σ, pk, txn) = true/false
```

Properties:
- Secret key `sk` never reconstructed anywhere
- Each party only ever sees their shard
- Standard Schnorr verification for settlement

### 9. Device-POS Communication
**Decision:** QR codes

```
Checkout Flow:
1. POS displays cart total + nonce on screen
2. User enters PIN in app
3. App computes partial_sig_A
4. App displays QR: {partial_sig_A, counter, user_id, txn_hash}
5. POS scans QR with camera
6. POS computes partial_sig_B, aggregates into σ
7. POS verifies signature locally
8. POS stores (σ, txn) for later settlement
```

- Universal: works on any phone, any POS with camera
- No special hardware, no pairing required
- Familiar UX (similar to many payment apps)

### 10. Wrong PIN Handling
**Decision:** POS detects via invalid signature

```
Wrong PIN → wrong partial_sig_A → aggregate fails verification
POS displays: "Verification failed — please re-enter PIN"
```

- Crypto naturally catches errors
- No device-side lockout (keeps it simple)
- POS can rate-limit (e.g., 3 failures → 30s cooldown) as policy

### 11. Key Revocation
**Decision:** Online revocation list with POS caching

```
Lost Phone:
  User reports via web/call → Server adds user_id to revocation list
  POS systems sync list when online (e.g., hourly)
  Offline: POS checks cached list → blocks revoked users

Compromised Store:
  ICA detects breach → Server adds store_id to revocation list
  Device apps sync list → "This store cannot accept offline payments"
```

- Staleness window (time between revocation and cache sync) is accepted trade-off
- Could add short-lived shard expiry as additional safety layer later

---

## Complete Flow Diagrams

### First Visit to Store (Online Required)

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  DEVICE  │         │   POS    │         │  SERVER  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │  "Register at this store"               │
     │────────────────────>                    │
     │                    │  Verify user, check standing
     │                    │────────────────────>
     │                    │                    │
     │                    │  User OK, limits   │
     │                    │<────────────────────
     │                    │                    │
     │  Initialize counter=0 for user          │
     │<────────────────────                    │
     │                    │                    │
     │  "Ready for offline payments"           │
     │<────────────────────                    │
```

### Subsequent Offline Payment

```
┌──────────┐         ┌──────────┐
│  DEVICE  │         │   POS    │
└────┬─────┘         └────┬─────┘
     │                    │
     │  Display cart, nonce
     │                    │───> (on screen)
     │                    │
     │  User enters PIN   │
     │  App: partial_sig_A = sign(A, PIN, counter++, txn)
     │                    │
     │  Display QR        │
     │──────────────────> │ (camera scan)
     │                    │
     │                    │  Check: user not revoked
     │                    │  Check: counter > last_seen
     │                    │  Check: txn_amount <= store_limit
     │                    │  Compute partial_sig_B
     │                    │  σ = aggregate(A, B)
     │                    │  Verify σ against pk
     │                    │
     │  "Payment approved" │
     │ <───────────────────
     │                    │
     │                    │  Store (σ, txn) for settlement
```

### Settlement (When Online)

```
┌──────────┐         ┌──────────┐
│   POS    │         │  SERVER  │
└────┬─────┘         └────┬─────┘
     │                    │
     │  Batch: [(σ₁,txn₁), (σ₂,txn₂), ...]
     │────────────────────>
     │                    │
     │                    │  For each (σ, txn):
     │                    │    Look up user pk, store commitment
     │                    │    Verify σ
     │                    │    Process payment
     │                    │    Update points
     │                    │
     │  Settlement confirmation
     │<────────────────────
```

---

## Security Properties

| Threat | Mitigation |
|--------|------------|
| Stolen phone | PIN required — thief can't produce valid partial_sig_A |
| Compromised store | Store's Shard B is unique — doesn't affect other stores |
| Replay attack | Counter binding — each signature only valid once |
| Brute-force PIN at POS | POS rate-limiting (policy layer) |
| Man-in-middle (QR) | txn_hash in signature — tampering invalidates proof |
| Offline fraud window | Store spending limits + revocation list caching |

---

## Additional Decisions

### 12. Phone Loss / Recovery
**Decision:** Re-enroll completely

- User reports lost phone → old Shard A added to revocation list
- User provisions new Shard A on new device
- Must re-register at each store (first visit online again)
- Simple, secure — no cloud backup attack surface

### 13. Multi-POS Terminal Architecture
**Decision:** Per-terminal Shard B with store-level orchestrator

```
┌──────────────────────────────────────────────────┐
│                    STORE                          │
│  ┌──────────────────────────────────────────┐    │
│  │         STORE ORCHESTRATOR               │    │
│  │  - Counter state per user                │    │
│  │  - Revocation list cache                 │    │
│  │  - Syncs to cloud when online            │    │
│  │  - User registration endpoint            │    │
│  └──────────────────────────────────────────┘    │
│        ▲              ▲              ▲           │
│   LAN  │         LAN  │         LAN  │           │
│  ┌─────┴────┐  ┌─────┴────┐  ┌─────┴────┐       │
│  │  POS 1   │  │  POS 2   │  │  POS 3   │       │
│  │ Shard B₁ │  │ Shard B₂ │  │ Shard B₃ │       │
│  │ (unique) │  │ (unique) │  │ (unique) │       │
│  └──────────┘  └──────────┘  └──────────┘       │
└──────────────────────────────────────────────────┘
```

- Each POS terminal has its own unique Shard B (cryptographic isolation)
- Compromised terminal only exposes that terminal's shard
- Store orchestrator manages counter state for all users
- User registers once at store level (via any terminal → orchestrator)
- POS terminals query orchestrator for counter validation over LAN
- Orchestrator syncs to central server for settlement + revocation

---

## Remaining Open Questions (Future)

1. **PIN recovery** — What if user forgets PIN? Requires online re-provisioning of Shard A?

2. **Multi-device** — Can user have Shard A on multiple devices (phone + watch)?

3. **Threshold parameters** — Currently 2-of-2 (device + POS). Could extend to 2-of-3 (device + POS + server) for high-value transactions?

4. **Audit trail** — Should device keep local log of payments for user review?

5. **Orchestrator failover** — What if store orchestrator is down? Fall back to online-only?

---

## Key Architectural Invariants

1. **Secret key never exists in one place** — fundamental threshold property
2. **PIN is cryptographic, not just UX** — wrong PIN = mathematically invalid signature
3. **Counters are per-store** — enables offline at familiar stores
4. **Store shards are locally generated** — no central shard distribution
5. **QR is the transport** — universal, no special hardware
6. **Revocation is cached** — staleness accepted for offline capability

---

## Summary

This architecture enables **fully offline payments** at stores where the user has previously registered (online), using **split-knowledge threshold cryptography**:

| Component | Location | Role |
|-----------|----------|------|
| Shard A | User's device | Identity factor (universal) |
| Shard B | Store POS terminal | Location authorization (per-terminal) |
| PIN | User's memory | Authentication factor (never stored) |
| Counter | Store orchestrator | Replay prevention (per-user-per-store) |
| Public key | Central server | Settlement verification |

**Trade-offs accepted:**
- First visit to new store requires online connectivity
- Revocation has staleness window (sync delay)
- Store policy limits (not per-user limits) for simplicity
- Re-enrollment required on phone loss (no cloud backup)

**Security guarantees:**
- No single point of compromise
- Stolen phone is useless without PIN
- Compromised store doesn't affect other stores
- Replay attacks blocked by counter binding
