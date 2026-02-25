"""Seed the product catalog with sample ICA products."""

from datetime import datetime, timezone

from app.db import connect_db, get_collection
from app.constants import product_key, DEFAULT_CURRENCY
from app.models.product import Product

STORE_ID = "store_042"

SAMPLE_PRODUCTS = [
    {"ean": "7310865085880", "name": "ICA Kvarnmjöl", "brand": "ICA", "category": "flour", "price": 24.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310865085880.jpg"},
    {"ean": "7310865004338", "name": "ICA Mellanmjölk 1.5%", "brand": "ICA", "category": "dairy", "price": 15.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310865004338.jpg"},
    {"ean": "7310860007698", "name": "ICA Pasta Penne", "brand": "ICA", "category": "pasta", "price": 12.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310860007698.jpg"},
    {"ean": "7340011492009", "name": "Oatly Havredryck", "brand": "Oatly", "category": "dairy_alternative", "price": 29.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7340011492009.jpg"},
    {"ean": "7310090776505", "name": "Pågen Lingongrova", "brand": "Pågen", "category": "bread", "price": 34.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310090776505.jpg"},
    {"ean": "7310865006417", "name": "ICA Smör Normalsaltat", "brand": "ICA", "category": "dairy", "price": 45.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310865006417.jpg"},
    {"ean": "7310500143408", "name": "Felix Ketchup", "brand": "Felix", "category": "condiment", "price": 32.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310500143408.jpg"},
    {"ean": "7310865085897", "name": "ICA Strösocker", "brand": "ICA", "category": "baking", "price": 19.90, "vat_rate": 12, "image_url": "https://cdn.ica.se/images/7310865085897.jpg"},
]


def seed():
    connect_db()
    collection = get_collection()
    now = datetime.now(timezone.utc).isoformat()

    print(f"Seeding {len(SAMPLE_PRODUCTS)} products for store {STORE_ID}...")

    for p in SAMPLE_PRODUCTS:
        key = product_key(STORE_ID, p["ean"])
        product = Product(
            store_id=STORE_ID,
            currency=DEFAULT_CURRENCY,
            in_stock=True,
            updated_at=now,
            **p,  # type: ignore[arg-type]
        )
        collection.upsert(key, product.model_dump())
        print(f"  Seeded: {product.name} ({key})")

    print("Seed complete.")


if __name__ == "__main__":
    seed()
