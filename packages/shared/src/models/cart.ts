export interface CartItem {
  ean: string;
  name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  scanned_at: string;
}

export interface CartTotals {
  items_count: number;
  subtotal: number;
  vat_total: number;
  total: number;
}

export type CartStatus = "active" | "checked_out" | "abandoned";

export interface Cart {
  type: "cart";
  cart_id: string;
  user_id: string;
  store_id: string;
  device_id: string;
  status: CartStatus;
  items: CartItem[];
  totals: CartTotals;
  created_at: string;
  updated_at: string;
}
