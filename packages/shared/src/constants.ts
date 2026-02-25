// Document type prefixes used as Couchbase document key prefixes
export const DocPrefix = {
  PRODUCT: "product",
  USER: "user",
  CART: "cart",
  TRANSACTION: "txn",
  POINTS_DELTA: "points_delta",
  RETURN_REQUEST: "return_request",
} as const;

// Document key builders
export const DocKey = {
  product: (storeId: string, ean: string) =>
    `${DocPrefix.PRODUCT}::${storeId}::${ean}`,
  user: (userId: string) => `${DocPrefix.USER}::${userId}`,
  cart: (cartId: string) => `${DocPrefix.CART}::${cartId}`,
  transaction: (txnId: string) => `${DocPrefix.TRANSACTION}::${txnId}`,
  pointsDelta: (deltaId: string) =>
    `${DocPrefix.POINTS_DELTA}::${deltaId}`,
  returnRequest: (returnId: string) =>
    `${DocPrefix.RETURN_REQUEST}::${returnId}`,
} as const;

// Sync Gateway channel name builders
export const Channel = {
  storeProducts: (storeId: string) => `store_${storeId}_products`,
  user: (userId: string) => `user_${userId}`,
  globalPromos: "global_promos",
} as const;

// Status enums
export const CartStatus = {
  ACTIVE: "active",
  CHECKED_OUT: "checked_out",
  ABANDONED: "abandoned",
} as const;

export const PaymentStatus = {
  PENDING_CAPTURE: "pending_capture",
  CAPTURED: "captured",
  FAILED: "failed",
} as const;

export const RefundStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  PROCESSED: "processed",
} as const;

export const PointsDeltaStatus = {
  PENDING: "pending",
  APPLIED: "applied",
} as const;

// Currency
export const DEFAULT_CURRENCY = "SEK";
