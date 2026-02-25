from typing import Literal

from pydantic import BaseModel


class CartItem(BaseModel):
    ean: str
    name: str
    qty: int
    unit_price: float
    line_total: float
    scanned_at: str


class CartTotals(BaseModel):
    items_count: int
    subtotal: float
    vat_total: float
    total: float


CartStatus = Literal["active", "checked_out", "abandoned"]


class Cart(BaseModel):
    type: Literal["cart"] = "cart"
    cart_id: str
    user_id: str
    store_id: str
    device_id: str
    status: CartStatus = "active"
    items: list[CartItem] = []
    totals: CartTotals
    created_at: str
    updated_at: str
