# Simple Offline Payment System

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SIMPLIFIED PAYMENT SYSTEM                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ONLINE (normal):     Phone ←→ Server ←→ POS                        │
│                                                                      │
│  POS OFFLINE + 5G:    Phone ←→ Server ... Phone → QR → POS          │
│                                                                      │
│  BOTH OFFLINE:        Pay with loyalty points only                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**No pre-locked funds. Real-time balance check. Minimal complexity.**

---

## How It Works

### Step 1: POS Shows What You Owe

```
POS displays (screen or QR):
{
  store_id: "store_042",
  pos_id: "pos_3",
  amount: 47.00,
  currency: "SEK",
  txn_id: "unique-uuid"
}
```

### Step 2: Phone Gets Authorization

```
Phone → Server:
{
  txn_id: "unique-uuid",
  amount: 47.00,
  user_id: "user_123"
}

Server checks:
  ✓ User has balance >= 47 SEK
  ✓ User not blocked
  ✓ Transaction looks valid

Server → Phone:
{
  txn_id: "unique-uuid",
  amount: 47.00,
  user_id: "user_123",
  authorized_at: "2024-01-15T10:30:00Z",
  expires_at: "2024-01-15T10:35:00Z",  // 5 min validity
  signature: "server_signs_all_above_fields"
}
```

### Step 3: Phone Shows QR to POS

```
┌─────────────┐         ┌─────────────┐
│     📱      │   QR    │     🖥️      │
│   Phone     │ ──────> │    POS      │
│             │         │             │
│  [QR CODE]  │         │  (scans)    │
└─────────────┘         └─────────────┘
```

### Step 4: POS Verifies (Offline)

```
POS has: Server's public key (cached)

POS verifies:
  ✓ Signature valid (server signed this)
  ✓ txn_id matches what POS generated
  ✓ amount matches
  ✓ not expired

POS stores: {authorization, actual_items, timestamp}

POS displays: "✅ Payment Approved"
```

### Step 5: Settlement (When Online)

```
POS → Server: Here are today's transactions + authorizations
Server: Verifies signatures, processes payments, updates balances
```

---

## That's It

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│   NO threshold crypto                                      │
│   NO shards                                                │
│   NO counters                                              │
│   NO orchestrator                                          │
│   NO store registration                                    │
│   NO PIN (use phone's FaceID/fingerprint to open app)      │
│                                                            │
│   JUST:                                                    │
│   - Server signs authorization                             │
│   - Phone shows QR                                         │
│   - POS verifies signature with cached public key          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## True Offline Fallback

When user has NO connectivity either:

### Option A: Loyalty Points Only

```
- Points balance is synced to device
- Phone signs: "Pay 47 SEK from my points"
- POS accepts (points are pre-committed value)
- No balance verification needed — points ARE the balance
```

### Option B: Micro-Credit with Identity

```
- User is authenticated (phone + biometrics)
- Store accepts up to 200 SEK on trust
- Settles later, user charged
- If user never pays → blocked from system
- Simple, low-tech, works
```

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  USER SCANS CART                                                 │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────┐    Phone has connectivity?                         │
│  │  📱     │──────────────────────────────┐                     │
│  └─────────┘                              │                     │
│       │                                   │                     │
│       │ YES                               │ NO                  │
│       ▼                                   ▼                     │
│  ┌─────────┐                        ┌──────────┐                │
│  │ Server  │                        │ Loyalty  │                │
│  │ signs   │                        │ points   │                │
│  │ authz   │                        │ only     │                │
│  └────┬────┘                        └────┬─────┘                │
│       │                                  │                      │
│       └──────────┬───────────────────────┘                      │
│                  │                                               │
│                  ▼                                               │
│            ┌──────────┐                                          │
│            │ Show QR  │                                          │
│            └────┬─────┘                                          │
│                 │                                                │
│                 ▼                                                │
│            ┌──────────┐                                          │
│            │ POS      │                                          │
│            │ scans +  │                                          │
│            │ verifies │                                          │
│            └────┬─────┘                                          │
│                 │                                                │
│                 ▼                                                │
│            ✅ DONE                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Speed

| Operation | Time |
|-----------|------|
| Scan POS display | ~1 sec |
| Server authorization (5G) | ~300ms |
| Generate QR | <100ms |
| POS scan + verify | <500ms |
| **Total** | **~2 seconds** |

---

## Benefits

| Benefit | Description |
|---------|-------------|
| 💰 **No locked funds** | Money only moves when you pay |
| ✅ **Real balance check** | Server verifies before authorizing |
| 📴 **Works POS offline** | QR + cached public key = no POS internet needed |
| 🔐 **Unforgeable** | Ed25519 signature from server |
| 📱 **No special hardware** | Standard QR codes |
| ⚡ **Fast** | ~2 seconds total |
| 🛠️ **Simple to build** | Days, not weeks |

---

## Cons / Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| ⚠️ **Needs user's 5G** | True offline falls back to loyalty points |
| ⚠️ **5-minute auth expiry** | Re-authorize if expired (rare edge case) |
| ⚠️ **QR slower than tap-to-pay** | 2 sec vs 1 sec — acceptable |

---

## Security

| Attack | Mitigation |
|--------|------------|
| Forge authorization | Can't — Ed25519 server signature |
| Replay QR code | txn_id is unique per transaction |
| Use expired auth | 5-minute expiry, POS checks timestamp |
| Modify amount | Signature covers all fields |
| Stolen phone | Need FaceID/fingerprint to open app |
| No money (offline) | Loyalty points = pre-committed value |

---

## What You Need to Build

| Component | Effort |
|-----------|--------|
| Server endpoint: `/authorize` | 1 day |
| Server: Ed25519 signing | Few hours |
| App: call server, generate QR | 1 day |
| POS: scan QR, verify signature | 1 day |
| Loyalty points offline mode | Already exists |

**Total: ~3-4 days**

---

## Comparison: Complex vs Simple

```
                        VAULT (COMPLEX)      SIMPLE VERSION
                        ───────────────      ──────────────
Threshold crypto        Yes                  No
Store shards            Yes                  No
Counter sync            Yes                  No
Orchestrator            Yes                  No
First-visit setup       Yes                  No
PIN entry               Yes                  No (biometrics)

Balance verified        ✅ (relay mode)      ✅ (always)
No locked funds         ✅                   ✅
Works POS offline       ✅                   ✅
True offline            ⚠️ (trust+limits)    ⚠️ (points only)

Implementation time     Weeks                Days
```

---

## TL;DR

1. **User scans cart** at POS
2. **Phone asks server** "Can user X pay 47 SEK?"
3. **Server signs authorization** (if balance OK)
4. **Phone shows QR** with signed auth
5. **POS scans, verifies signature** (offline, using cached public key)
6. **Done.** Settlement happens later.

**No locked funds. Real balance check. Ships in days.**
