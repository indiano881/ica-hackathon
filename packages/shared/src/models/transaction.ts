import { CartItem } from "./cart";

export type PaymentMethod = "preauth" | "loyalty" | "card";
export type PaymentStatus = "pending_capture" | "captured" | "failed";

export interface TransactionPayment {
  method: PaymentMethod;
  preauth_token: string | null;
  amount: number;
  status: PaymentStatus;
  settled_at: string | null;
}

export interface TransactionTotals {
  subtotal: number;
  vat_total: number;
  total: number;
}

export interface Transaction {
  type: "transaction";
  txn_id: string;
  cart_id: string;
  user_id: string;
  store_id: string;
  device_id: string;
  items: CartItem[];
  totals: TransactionTotals;
  payment: TransactionPayment;
  points_earned: number;
  offline: boolean;
  created_at: string;
  synced_at: string | null;
}
