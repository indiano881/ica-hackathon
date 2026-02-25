"""Document key builders and constants — mirrors packages/shared/src/constants.ts."""

from uuid import uuid4

DEFAULT_CURRENCY = "SEK"


# Document key builders
def product_key(store_id: str, ean: str) -> str:
    return f"product::{store_id}::{ean}"


def user_key(user_id: str) -> str:
    return f"user::{user_id}"


def cart_key(cart_id: str) -> str:
    return f"cart::{cart_id}"


def transaction_key(txn_id: str) -> str:
    return f"txn::{txn_id}"


def points_delta_key(delta_id: str) -> str:
    return f"points_delta::{delta_id}"


def return_request_key(return_id: str) -> str:
    return f"return_request::{return_id}"


# Channel name builders
def store_products_channel(store_id: str) -> str:
    return f"store_{store_id}_products"


def user_channel(user_id: str) -> str:
    return f"user_{user_id}"


GLOBAL_PROMOS_CHANNEL = "global_promos"


# ID generators
def generate_id(prefix: str) -> str:
    short = uuid4().hex[:8]
    return f"{prefix}_{short}"
