from typing import Literal

from pydantic import BaseModel

from .cart import CartItem

PaymentMethod = Literal["preauth", "loyalty", "card"]
PaymentStatus = Literal["pending_capture", "captured", "failed"]


class TransactionPayment(BaseModel):
    method: PaymentMethod
    preauth_token: str | None = None
    amount: float
    status: PaymentStatus = "pending_capture"
    settled_at: str | None = None


class TransactionTotals(BaseModel):
    subtotal: float
    vat_total: float
    total: float


class Transaction(BaseModel):
    type: Literal["transaction"] = "transaction"
    txn_id: str
    cart_id: str
    user_id: str
    store_id: str
    device_id: str
    items: list[CartItem] = []
    totals: TransactionTotals
    payment: TransactionPayment
    points_earned: int
    offline: bool = False
    created_at: str
    synced_at: str | None = None
