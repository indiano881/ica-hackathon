"""Points delta aggregation service."""

from datetime import datetime, timezone

from couchbase.options import QueryOptions  # type: ignore[import-untyped]

from ..db import get_cluster, get_collection
from ..constants import points_delta_key, generate_id
from ..config import settings
from ..models.transaction import Transaction
from ..models.points_delta import PointsDelta


def apply_points_delta(txn: Transaction) -> None:
    """Create a points delta document when a transaction is settled."""
    collection = get_collection()
    delta_id = generate_id("pd")

    delta = PointsDelta(
        delta_id=delta_id,
        user_id=txn.user_id,
        txn_id=txn.txn_id,
        delta=txn.points_earned,
        reason="purchase",
        store_id=txn.store_id,
        status="applied",
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    key = points_delta_key(delta_id)
    collection.upsert(key, delta.model_dump())
    print(f"[Points] Applied +{delta.delta} points for user {txn.user_id}")


def aggregate_points(user_id: str) -> int:
    """
    Aggregate all points deltas for a user.
    This is the source of truth — never read points_balance from the user doc directly.
    """
    cluster = get_cluster()
    bucket = settings.couchbase_bucket
    result = cluster.query(
        f"SELECT SUM(d.`delta`) AS total FROM `{bucket}` d "
        "WHERE d.type = 'points_delta' AND d.user_id = $user_id AND d.status = 'applied'",
        QueryOptions(named_parameters={"user_id": user_id}),
    )
    for row in result:
        return int(row.get("total") or 0)
    return 0
