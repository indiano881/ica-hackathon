from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from couchbase.exceptions import DocumentNotFoundException  # type: ignore[import-untyped]
from couchbase.options import QueryOptions  # type: ignore[import-untyped]

from ..db import get_collection, get_cluster
from ..config import settings
from ..constants import transaction_key
from ..models.transaction import Transaction
from ..services.payment import capture_payment
from ..services.points import apply_points_delta

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/")
def list_transactions(user_id: str = Query(...)):
    cluster = get_cluster()
    bucket = settings.couchbase_bucket
    result = cluster.query(
        f"SELECT META().id, t.* FROM `{bucket}` t "
        "WHERE t.type = 'transaction' AND t.user_id = $user_id "
        "ORDER BY t.created_at DESC",
        QueryOptions(named_parameters={"user_id": user_id}),
    )
    return list(result)


@router.get("/{txn_id}")
def get_transaction(txn_id: str):
    collection = get_collection()
    key = transaction_key(txn_id)
    try:
        result = collection.get(key)
        return result.content_as[dict]
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="Transaction not found")


@router.post("/{txn_id}/settle")
def settle_transaction(txn_id: str):
    """Capture payment and apply points for a synced transaction."""
    collection = get_collection()
    key = transaction_key(txn_id)

    try:
        result = collection.get(key)
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn = Transaction(**result.content_as[dict])

    if txn.payment.status == "captured":
        return {"message": "Already settled", "txn": txn.model_dump()}

    # Capture the payment
    status, settled_at = capture_payment(txn)
    txn.payment.status = status
    txn.payment.settled_at = settled_at
    txn.synced_at = datetime.now(timezone.utc).isoformat()

    collection.replace(key, txn.model_dump())

    # Apply points delta
    apply_points_delta(txn)

    return {"message": "Transaction settled", "txn": txn.model_dump()}
