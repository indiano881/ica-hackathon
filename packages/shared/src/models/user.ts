export interface PaymentPreauth {
  token: string;
  ceiling_sek: number;
  authorized_at: string;
  expires_at: string;
}

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface User {
  type: "user";
  user_id: string;
  name: string;
  email: string;
  loyalty_tier: LoyaltyTier;
  points_balance: number;
  payment_preauth: PaymentPreauth | null;
  store_id: string;
  synced_at: string | null;
}
