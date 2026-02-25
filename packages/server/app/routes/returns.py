from fastapi import APIRouter, HTTPException, Query
from couchbase.exceptions import DocumentNotFoundException  # type: ignore[import-untyped]
from couchbase.options import QueryOptions  # type: ignore[import-untyped]

from ..db import get_collection, get_cluster
from ..config import settings
from ..constants import return_request_key
from ..models.return_request import ReturnRequest
from ..services.payment import process_refund

router = APIRouter(prefix="/api/returns", tags=["returns"])


@router.get("/")
def list_returns(user_id: str = Query(...)):
    cluster = get_cluster()
    bucket = settings.couchbase_bucket
    result = cluster.query(
        f"SELECT META().id, r.* FROM `{bucket}` r "
        "WHERE r.type = 'return_request' AND r.user_id = $user_id "
        "ORDER BY r.created_at DESC",
        QueryOptions(named_parameters={"user_id": user_id}),
    )
    return list(result)


@router.post("/{return_id}/approve")
def approve_return(return_id: str):
    collection = get_collection()
    key = return_request_key(return_id)

    try:
        result = collection.get(key)
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="Return not found")

    return_req = ReturnRequest(**result.content_as[dict])

    if return_req.refund.status != "pending":
        return {"message": f"Return already {return_req.refund.status}", "return": return_req.model_dump()}

    refund_status = process_refund(return_req)
    return_req.refund.status = refund_status

    collection.replace(key, return_req.model_dump())
    return {"message": "Return approved", "return": return_req.model_dump()}


@router.post("/{return_id}/reject")
def reject_return(return_id: str):
    collection = get_collection()
    key = return_request_key(return_id)

    try:
        result = collection.get(key)
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="Return not found")

    return_req = ReturnRequest(**result.content_as[dict])
    return_req.refund.status = "rejected"

    collection.replace(key, return_req.model_dump())
    return {"message": "Return rejected", "return": return_req.model_dump()}
