# ICA Vault: Offline Payments Without Locking Your Money

## The Problem with Pre-Auth Tokens

Traditional offline payment systems **lock your money before you shop**:

```
❌ OLD APPROACH (Pre-Auth)
┌─────────────────────────────────────────────────────────┐
│  "I want to buy groceries offline"                      │
│                                                         │
│  System: "OK, we'll lock 500 SEK from your account"     │
│                                                         │
│  You buy: 47 SEK of milk and bread                      │
│                                                         │
│  Result: 453 SEK locked for 3-5 days until release      │
│                                                         │
│  😤 Your money is hostage "just in case"                │
└─────────────────────────────────────────────────────────┘
```

---

## Our Solution: Hybrid Smart Payments

**No money is locked. Ever.**

We detect connectivity and use the **best available method**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      THREE PAYMENT MODES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📶 MODE 1: POS Online                                           │
│     → Standard server authorization                              │
│     → Real-time balance check                                    │
│                                                                  │
│  📱 MODE 2: POS Offline + User has 5G    ← MOST COMMON          │
│     → User's phone relays to server                              │
│     → Server signs authorization                                 │
│     → Real-time balance check via relay                          │
│                                                                  │
│  🔒 MODE 3: Both Offline (rare)                                  │
│     → Vault cryptographic proof                                  │
│     → Trust with store limits                                    │
│     → Or loyalty points payment only                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mode 2: The Relay (Most Interesting)

When the store's internet is down but you have 5G:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   🖥️ POS (offline)          📱 User Phone (5G)         ☁️ Server    │
│                                                                      │
│       │                           │                         │        │
│       │  1. Display txn info      │                         │        │
│       │─────────────────────────> │                         │        │
│       │     {47 SEK, txn_id}      │                         │        │
│       │                           │                         │        │
│       │                           │  2. Relay + balance req │        │
│       │                           │────────────────────────>│        │
│       │                           │                         │        │
│       │                           │                    ┌────┴────┐   │
│       │                           │                    │ Check:  │   │
│       │                           │                    │ Balance │   │
│       │                           │                    │ Revoked?│   │
│       │                           │                    │ Limits? │   │
│       │                           │                    └────┬────┘   │
│       │                           │                         │        │
│       │                           │  3. Signed authorization│        │
│       │                           │<────────────────────────│        │
│       │                           │                         │        │
│       │  4. Show QR with sig      │                         │        │
│       │<───────────────────────── │                         │        │
│       │                           │                         │        │
│  ┌────┴────┐                      │                         │        │
│  │ Verify  │  Server's public key cached on POS             │        │
│  │ server  │  Can verify signature WITHOUT internet         │        │
│  │ sig     │                                                │        │
│  └────┬────┘                                                │        │
│       │                           │                         │        │
│       │  5. ✅ APPROVED           │                         │        │
│       │─────────────────────────> │                         │        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

KEY INSIGHT: User's phone is a "dumb pipe" — it CANNOT forge the server's
signature. The POS verifies the signature locally using cached public key.
```

---

## Mode 3: True Offline (Vault)

When BOTH POS and user have no connectivity:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    🔐 YOUR PHONE        🏪 STORE POS        🧠 YOUR PIN              │
│    (Shard A)            (Shard B)           (Factor C)              │
│         │                    │                   │                   │
│         └────────────────────┼───────────────────┘                   │
│                              │                                       │
│                              ▼                                       │
│                    ┌─────────────────┐                               │
│                    │  VAULT PROOF    │                               │
│                    │  (crypto sig)   │                               │
│                    └─────────────────┘                               │
│                              │                                       │
│                              ▼                                       │
│                    Store accepts with limits                         │
│                    (e.g., max 500 SEK)                               │
│                                                                      │
│    ⚠️  No real-time balance check — trust with limits               │
│    💰 Alternative: Pay with loyalty points only                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How Balance Verification Works

| Mode | Balance Check | How |
|------|---------------|-----|
| **POS Online** | ✅ Real-time | Server checks directly |
| **Relay (5G)** | ✅ Real-time | Server checks via phone relay |
| **True Offline** | ❌ No check | Trust with limits OR loyalty points |

**The relay mode is the magic** — store internet down is common, but users usually have 5G. We get real-time verification without POS connectivity.

---

## Complete Checkout Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CHECKOUT FLOW                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   STEP 1: POS displays transaction                                    │
│   ┌─────────┐                      ┌─────────┐                       │
│   │  📱     │   "47 SEK total"     │   🖥️    │                       │
│   │  App    │ <──────────────────  │   POS   │                       │
│   └─────────┘    (screen/QR)       └─────────┘                       │
│                                                                       │
│   STEP 2: App detects connectivity                                    │
│   ┌─────────┐                                                        │
│   │  📱     │  Phone has 5G? → Use RELAY mode                        │
│   │  App    │  No connection? → Use VAULT mode                       │
│   └─────────┘                                                        │
│                                                                       │
│   STEP 3a: RELAY MODE (phone has 5G)                                  │
│   ┌─────────┐                      ┌─────────┐                       │
│   │  📱     │ ───── 5G ──────────> │   ☁️    │                       │
│   │  App    │                      │ Server  │ Checks balance        │
│   │         │ <──────────────────  │         │ Signs authorization   │
│   └─────────┘   Signed auth        └─────────┘                       │
│                                                                       │
│   STEP 3b: VAULT MODE (no connection)                                 │
│   ┌─────────┐                                                        │
│   │  📱     │  Enter PIN                                             │
│   │  App    │  Generate vault proof (Shard A + PIN)                  │
│   └─────────┘                                                        │
│                                                                       │
│   STEP 4: Show authorization to POS                                   │
│   ┌─────────┐      QR Code         ┌─────────┐                       │
│   │  📱     │  ─────────────────>  │   🖥️    │                       │
│   │ [QR]    │                      │   POS   │                       │
│   └─────────┘                      └─────────┘                       │
│                                                                       │
│   STEP 5: POS verifies                                                │
│   ┌─────────┐                      ┌─────────┐                       │
│   │  📱     │    "✅ APPROVED"     │   🖥️    │                       │
│   │  App    │ <──────────────────  │   POS   │                       │
│   └─────────┘                      └─────────┘                       │
│                                                                       │
│   RELAY: Verifies server signature (cached public key)                │
│   VAULT: Verifies vault proof (Shard B + counter check)               │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Speed

| Operation | Relay Mode | Vault Mode |
|-----------|------------|------------|
| User scans POS display | ~1 sec | ~1 sec |
| Server round-trip (5G) | ~300ms | N/A |
| Enter PIN | N/A | ~2 sec |
| Generate proof/QR | <100ms | <100ms |
| POS scan + verify | <500ms | <500ms |
| **Total** | **~2 seconds** | **~4 seconds** |

Both comparable to card payments.

---

## Benefits

| Benefit | Description |
|---------|-------------|
| 💰 **No locked funds** | Your money stays yours until you pay |
| 📶 **Smart mode selection** | Automatically picks best method |
| ✅ **Real balance check (relay)** | Server verifies even when POS offline |
| 📴 **True offline fallback** | Vault mode when nothing works |
| 🔐 **Unforgeable relay** | User can't fake server's signature |
| 📱 **No special hardware** | QR codes work on any phone/camera |
| 🏪 **Store isolation** | Compromised store doesn't affect others |
| 🚫 **Theft protection** | Stolen phone useless without PIN (vault mode) |

---

## Cons / Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| ⚠️ **True offline has no balance check** | Store limits (500 SEK) + loyalty points fallback |
| ⚠️ **First store visit requires online** | One-time setup; most users have regular stores |
| ⚠️ **Relay needs user's 5G** | Most users have mobile data; true offline is fallback |
| ⚠️ **Store infrastructure needed** | Orchestrator for vault mode counter management |
| ⚠️ **Slightly slower than tap-to-pay** | 2-4 seconds vs ~1 second; acceptable |

---

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     ATTACK SCENARIOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  😈 User tries to fake balance (relay mode)                      │
│     → Server signs the authorization, not the user               │
│     → User's phone is just a relay — can't forge signature       │
│     → ❌ Cannot fake balance                                     │
│                                                                  │
│  😈 Thief steals phone (vault mode)                              │
│     → Has Shard A                                                │
│     → Doesn't know PIN                                           │
│     → ❌ Cannot pay                                              │
│                                                                  │
│  😈 Replay attack (reuse old QR)                                 │
│     → Relay: Server checks txn_id uniqueness                     │
│     → Vault: Counter is monotonic, POS rejects old               │
│     → ❌ Cannot replay                                           │
│                                                                  │
│  😈 Man-in-middle (modify QR)                                    │
│     → Relay: Server signature covers txn details                 │
│     → Vault: Transaction hash is signed                          │
│     → ❌ Cannot modify                                           │
│                                                                  │
│  😈 User has no money (true offline)                             │
│     → Store limits cap exposure (e.g., 500 SEK max)              │
│     → Settlement reveals fraud → user blacklisted                │
│     → Alternative: Loyalty points only (pre-existing balance)    │
│     → ⚠️ Managed risk                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Pre-Auth vs Our Hybrid

```
                        PRE-AUTH TOKENS       OUR HYBRID
                        ───────────────       ──────────
Money locked upfront?   ❌ YES (500 SEK)      ✅ NO
Works offline?          ✅ Yes                ✅ Yes
Balance verified?       ⚠️  At pre-auth only  ✅ Real-time (relay)
Theft protection?       ⚠️  Token can be used ✅ PIN required (vault)
Store compromise?       ⚠️  Tokens leak       ✅ Isolated shards
Implementation?         ✅ Simple             ⚠️  Medium complexity
First-visit online?     ✅ No                 ⚠️  Yes (vault mode)
```

---

## One-Liner

> **"Pay offline without pre-locking money. If you have 5G, we verify your balance in real-time through your phone. If you're truly offline, cryptographic vault proof with store limits."**

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                           CENTRAL SERVER                             │
│              (balance check, authorization signing,                  │
│               settlement, revocation list)                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
         ▲                                      ▲
         │                                      │
         │ Direct (POS online)                  │ Relay (user's 5G)
         │                                      │
┌────────┴─────────────────────────────────────────────────────────────┐
│                              STORE                                    │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    STORE ORCHESTRATOR                          │   │
│  │           (vault counter state, revocation cache,              │   │
│  │            server public key for relay verification)           │   │
│  └───────────────────────────────────────────────────────────────┘   │
│         ▲                    ▲                    ▲                   │
│    LAN  │               LAN  │               LAN  │                   │
│  ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐            │
│  │   POS 1     │     │   POS 2     │     │   POS 3     │            │
│  │             │     │             │     │             │            │
│  │ Server PK   │     │ Server PK   │     │ Server PK   │            │
│  │ (for relay) │     │ (for relay) │     │ (for relay) │            │
│  │             │     │             │     │             │            │
│  │ Shard B₁    │     │ Shard B₂    │     │ Shard B₃    │            │
│  │ (for vault) │     │ (for vault) │     │ (for vault) │            │
│  └─────────────┘     └─────────────┘     └─────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
         ▲
         │ QR code (relay auth OR vault proof)
         │
┌────────┴────────┐
│    📱 DEVICE    │
│                 │
│  App detects:   │
│  - Has 5G? ───────> Relay mode (server signs)
│  - No conn? ──────> Vault mode (Shard A + PIN)
│                 │
└─────────────────┘
```

---

## The Key Innovation

**We use the user's phone as a secure relay when POS is offline.**

- Store internet down? Common.
- User has 5G? Almost always.
- Solution: Route through user's phone, server signs authorization.
- POS verifies server signature locally (cached public key).
- **User cannot forge the server's signature.**

This gives us **real-time balance verification** without POS connectivity in the most common "offline" scenario.

True offline (vault mode) is the **fallback**, not the primary path.

---

## TL;DR

| Situation | What Happens | Balance Verified? |
|-----------|--------------|-------------------|
| POS online | Normal payment | ✅ Yes |
| POS offline, you have 5G | Phone relays to server | ✅ Yes |
| Both offline | Vault proof + store limits | ❌ No (trust) |

**No money locked. Real-time balance check in most cases. Cryptographic fallback when truly offline.**
