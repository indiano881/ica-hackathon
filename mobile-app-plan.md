# Plan: Apply Style Guide + Fix State Management + Build Mobile App

## Context

The app scaffold (Phase 1) is complete but has two critical issues: (1) hooks use local `useState` so state isn't shared across screens — cart added in ScanScreen is `null` in CartScreen, and (2) all colors are hardcoded inline with no theme system. The style guide (`style.md`) defines ICA brand colors that differ from what's currently in the code. This plan addresses both issues to make the app functional and properly styled.

## New Files (3)

### `src/theme.ts`
Central theme constants. Key tokens:
- `Colors.primary`: `#cf2005` (replaces `#E3000B` everywhere)
- `Colors.background`: `#a3a3a3` (page-level gray)
- `Colors.surface`: `#ffffff` (cards/panels floating on gray bg)
- `Colors.text`: `#2e2929` (replaces `#333`)
- `Colors.textSecondary`, `Colors.textMuted`, `Colors.success` (`#4CAF50`), `Colors.warning` (`#FF9800`), `Colors.border`, `Colors.disabled`
- Semantic sync colors and tier colors stay as-is (domain-specific)
- `Typography` with `fontFamily: "IcaTextNy"` (fallback `"System"` — font file not yet available)
- `Spacing` and `Radius` tokens

### `src/contexts/AuthContext.tsx`
- Lifts `useAuth` state into React Context so `user` is shared across all screens
- `AuthProvider` wraps the app tree
- Exposes: `{ user, login(userId), logout }`
- Logic moves from `hooks/useAuth.ts` → here

### `src/contexts/CartContext.tsx`
- Lifts `useCart` state into React Context — **this is the critical bug fix**
- `CartProvider` wraps the app tree (inside AuthProvider)
- Exposes: `{ cart, initCart(userId, storeId), addItem, removeItem, updateItemQty, setCartStatus, clearCart }`
- `initCart` is idempotent — no-op if cart already exists (safe for re-renders)
- Logic moves from `hooks/useCart.ts` → here

## Modified Files (13)

### `src/hooks/useAuth.ts` → thin re-export from `contexts/AuthContext`
### `src/hooks/useCart.ts` → thin re-export from `contexts/CartContext`

All existing `import { useAuth } from "../hooks/useAuth"` lines across screens continue working unchanged.

### `src/App.tsx`
- Wrap NavigationContainer in `<AuthProvider><CartProvider>...</CartProvider></AuthProvider>`
- Header color `#E3000B` → `Colors.primary`

### Screens (6 files)
- **HomeScreen**: gray background, white card panel for login/profile, theme colors
- **ScanScreen**: change `useCart(userId, storeId)` → `useCart()` + `useEffect(() => initCart(...))` — **critical functional fix**; camera bg stays black
- **CartScreen**: theme colors, cart reads from context correctly now
- **CheckoutScreen**: gray bg with white surface cards for summary/payment; pay button stays green (`Colors.success`)
- **ReceiptScreen**: white bg (paper receipt metaphor), theme color tokens
- **ReturnScreen**: theme colors, selection border uses `Colors.primary`

### Components (3 files — SyncStatusBadge left untouched)
- **CartItem**: border/text colors → theme tokens
- **PointsDisplay**: text colors → theme tokens (tier colors stay as-is)
- **ProductCard**: brand/price/button colors → theme tokens

## Design Decisions

- **Gray bg + white cards pattern**: `#a3a3a3` is dark, so content floats on white `surface` cards. Receipt and Cart screens stay mostly white for readability.
- **Pay button stays green**: `Colors.success` not `Colors.primary` — green means "confirm", red would be confusing.
- **SyncStatusBadge and tier colors unchanged**: these are semantic/domain colors, not brand colors.
- **Hook re-export pattern**: moving logic into contexts but keeping hooks as re-exports means zero import changes across screens.
- **Font deferred**: "Ica Text Ny" defined in theme but not loaded yet (no font file). System font fallback until font file is provided.

## Execution Order

1. Create `src/theme.ts`
2. Create `src/contexts/AuthContext.tsx`
3. Create `src/contexts/CartContext.tsx`
4. Refactor `src/hooks/useAuth.ts` and `src/hooks/useCart.ts` to re-exports
5. Update `src/App.tsx` (providers + theme)
6. Update `ScanScreen.tsx` (critical: initCart pattern)
7. Update remaining screens (Home, Cart, Checkout, Receipt, Return)
8. Update components (CartItem, PointsDisplay, ProductCard)

## Verification

- `npx tsc --noEmit` from `packages/app` — no type errors
- `npx expo start` — app launches, no runtime crashes
- Manual flow: Home → enter card number → Scan → scan item → Cart (cart should show items!) → Checkout → Receipt → Return
- Verify gray background with white cards visible on Home, Checkout screens
- Verify header is `#cf2005` dark red
