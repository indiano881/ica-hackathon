from typing import Literal

from pydantic import BaseModel

RefundMethod = Literal["loyalty_credit", "card_refund"]
RefundStatus = Literal["pending", "approved", "rejected", "processed"]


class ReturnItem(BaseModel):
    ean: str
    qty: int
    unit_price: float
    reason: str


class Refund(BaseModel):
    amount: float
    method: RefundMethod
    status: RefundStatus = "pending"


class ReturnRequest(BaseModel):
    type: Literal["return_request"] = "return_request"
    return_id: str
    user_id: str
    store_id: str
    original_txn_id: str
    items: list[ReturnItem] = []
    refund: Refund
    points_delta: int
    offline: bool = False
    created_at: str
