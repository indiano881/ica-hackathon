from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from couchbase.exceptions import DocumentNotFoundException  # type: ignore[import-untyped]
from couchbase.options import QueryOptions  # type: ignore[import-untyped]

from ..db import get_collection, get_cluster
from ..config import settings
from ..constants import product_key
from ..models.product import Product

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/")
def list_products(store_id: str = Query(...)):
    cluster = get_cluster()
    bucket = settings.couchbase_bucket
    result = cluster.query(
        f"SELECT META().id, p.* FROM `{bucket}` p "
        "WHERE p.type = 'product' AND p.store_id = $store_id",
        QueryOptions(named_parameters={"store_id": store_id}),
    )
    return list(result)


@router.get("/{store_id}/{ean}")
def get_product(store_id: str, ean: str):
    collection = get_collection()
    key = product_key(store_id, ean)
    try:
        result = collection.get(key)
        return result.content_as[dict]
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="Product not found")


@router.put("/{store_id}/{ean}")
def upsert_product(store_id: str, ean: str, body: dict):
    collection = get_collection()
    key = product_key(store_id, ean)
    product = Product(
        ean=ean,
        store_id=store_id,
        updated_at=datetime.now(timezone.utc).isoformat(),
        **body,
    )
    collection.upsert(key, product.model_dump())
    return {"key": key, "product": product.model_dump()}


@router.delete("/{store_id}/{ean}")
def delete_product(store_id: str, ean: str):
    collection = get_collection()
    key = product_key(store_id, ean)
    try:
        collection.remove(key)
        return {"deleted": key}
    except DocumentNotFoundException:
        raise HTTPException(status_code=404, detail="Product not found")
