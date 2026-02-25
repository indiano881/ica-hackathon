export type PointsDeltaReason = "purchase" | "return" | "promo" | "adjustment";
export type PointsDeltaStatus = "pending" | "applied";

export interface PointsDelta {
  type: "points_delta";
  delta_id: string;
  user_id: string;
  txn_id: string;
  delta: number;
  reason: PointsDeltaReason;
  store_id: string;
  status: PointsDeltaStatus;
  created_at: string;
}
