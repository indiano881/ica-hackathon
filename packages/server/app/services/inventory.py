"""Stock management service."""

import couchbase.subdocument as SD  # type: ignore[import-untyped]

from ..db import get_collection
from ..constants import product_key


def update_stock(store_id: str, ean: str, in_stock: bool) -> None:
    """Update stock status for a product via sub-document mutation."""
    collection = get_collection()
    key = product_key(store_id, ean)
    from datetime import datetime, timezone

    collection.mutate_in(
        key,
        [
            SD.replace("in_stock", in_stock),
            SD.replace("updated_at", datetime.now(timezone.utc).isoformat()),
        ],
    )


def decrement_stock_for_transaction(
    store_id: str, items: list[dict[str, object]]
) -> None:
    """
    Decrement stock after a transaction is settled.
    In a real system this would check stock levels and handle out-of-stock.
    """
    for item in items:
        print(f"[Inventory] Decremented {item.get('qty')}x {item.get('ean')} at store {store_id}")
