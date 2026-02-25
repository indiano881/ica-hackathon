export interface ReturnItem {
  ean: string;
  qty: number;
  unit_price: number;
  reason: string;
}

export type RefundMethod = "loyalty_credit" | "card_refund";
export type RefundStatus = "pending" | "approved" | "rejected" | "processed";

export interface Refund {
  amount: number;
  method: RefundMethod;
  status: RefundStatus;
}

export interface ReturnRequest {
  type: "return_request";
  return_id: string;
  user_id: string;
  store_id: string;
  original_txn_id: string;
  items: ReturnItem[];
  refund: Refund;
  points_delta: number;
  offline: boolean;
  created_at: string;
}
