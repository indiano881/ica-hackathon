from typing import Literal

from pydantic import BaseModel


class PaymentPreauth(BaseModel):
    token: str
    ceiling_sek: float
    authorized_at: str
    expires_at: str


LoyaltyTier = Literal["bronze", "silver", "gold", "platinum"]


class User(BaseModel):
    type: Literal["user"] = "user"
    user_id: str
    name: str
    email: str
    loyalty_tier: LoyaltyTier = "bronze"
    points_balance: int = 0
    payment_preauth: PaymentPreauth | None = None
    store_id: str
    synced_at: str | None = None
