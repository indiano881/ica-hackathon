from typing import Literal

from pydantic import BaseModel

PointsDeltaReason = Literal["purchase", "return", "promo", "adjustment"]
PointsDeltaStatus = Literal["pending", "applied"]


class PointsDelta(BaseModel):
    type: Literal["points_delta"] = "points_delta"
    delta_id: str
    user_id: str
    txn_id: str
    delta: int
    reason: PointsDeltaReason
    store_id: str
    status: PointsDeltaStatus = "pending"
    created_at: str
