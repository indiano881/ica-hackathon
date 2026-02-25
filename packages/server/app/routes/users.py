from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from couchbase.exceptions import DocumentNotFoundException  # type: ignore[import-untyped]

from ..db import get_collection
from ..constants import user_key
from ..models.user import User
from ..services.points import aggregate_points

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{user_id}")
def get_user(user_id: str):
    collection = get_collection()
    key = user_key(user_id)
    try:
        result = collection.get(key)
        return result.content_as[dict]
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="User not found")


@router.put("/{user_id}")
def upsert_user(user_id: str, body: dict):
    collection = get_collection()
    key = user_key(user_id)
    user = User(
        user_id=user_id,
        synced_at=datetime.now(timezone.utc).isoformat(),
        **body,
    )
    collection.upsert(key, user.model_dump())
    return {"key": key, "user": user.model_dump()}


@router.get("/{user_id}/points")
def get_user_points(user_id: str):
    """Aggregate all points deltas for a user."""
    total = aggregate_points(user_id)
    return {"user_id": user_id, "points_balance": total}
