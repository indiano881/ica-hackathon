from datetime import timedelta

from couchbase.auth import PasswordAuthenticator  # type: ignore[import-untyped]
from couchbase.cluster import Cluster  # type: ignore[import-untyped]
from couchbase.collection import Collection  # type: ignore[import-untyped]
from couchbase.bucket import Bucket  # type: ignore[import-untyped]
from couchbase.options import ClusterOptions  # type: ignore[import-untyped]

from .config import settings

_cluster: Cluster | None = None
_bucket: Bucket | None = None
_collection: Collection | None = None


def connect_db() -> None:
    global _cluster, _bucket, _collection

    auth = PasswordAuthenticator(settings.couchbase_username, settings.couchbase_password)
    _cluster = Cluster(settings.couchbase_connection_string, ClusterOptions(auth))
    _cluster.wait_until_ready(timedelta(seconds=5))

    _bucket = _cluster.bucket(settings.couchbase_bucket)
    _collection = _bucket.default_collection()

    print(f"Connected to Couchbase bucket: {settings.couchbase_bucket}")


def get_cluster() -> Cluster:
    if _cluster is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _cluster


def get_bucket() -> Bucket:
    if _bucket is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _bucket


def get_collection() -> Collection:
    if _collection is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _collection
