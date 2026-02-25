from typing import Literal

from pydantic import BaseModel


class Product(BaseModel):
    type: Literal["product"] = "product"
    ean: str
    name: str
    brand: str
    category: str
    price: float
    currency: str = "SEK"
    vat_rate: float
    image_url: str
    store_id: str
    in_stock: bool = True
    updated_at: str
