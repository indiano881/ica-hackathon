#!/bin/sh
set -e

CB_HOST="couchbase"
CB_USER="admin"
CB_PASS="password"
CB_BUCKET="ica-checkout"

echo "=== Initializing Couchbase cluster ==="

# Initialize the cluster
curl -sf -X POST "http://${CB_HOST}:8091/clusterInit" \
  -d "hostname=127.0.0.1" \
  -d "username=${CB_USER}" \
  -d "password=${CB_PASS}" \
  -d "services=kv,n1ql,index" \
  -d "memoryQuota=512" \
  -d "indexMemoryQuota=256" \
  -d "port=SAME" \
  || echo "(cluster may already be initialized)"

echo "Waiting for cluster to settle..."
sleep 5

# Set indexer storage mode (required before creating indexes on community edition)
echo "=== Setting indexer storage mode ==="
curl -sf -X POST "http://${CB_HOST}:8091/settings/indexes" \
  -u "${CB_USER}:${CB_PASS}" \
  -d "storageMode=forestdb" \
  || echo "(storage mode may already be set)"

# Create the bucket
echo "=== Creating bucket: ${CB_BUCKET} ==="
curl -sf -X POST "http://${CB_HOST}:8091/pools/default/buckets" \
  -u "${CB_USER}:${CB_PASS}" \
  -d "name=${CB_BUCKET}" \
  -d "bucketType=couchbase" \
  -d "ramQuota=256" \
  -d "flushEnabled=1" \
  || echo "(bucket may already exist)"

echo "Waiting for bucket to be ready..."
sleep 5

# Create primary index for N1QL queries
echo "=== Creating primary index ==="
curl -sf -X POST "http://${CB_HOST}:8093/query/service" \
  -u "${CB_USER}:${CB_PASS}" \
  -d "statement=CREATE PRIMARY INDEX IF NOT EXISTS ON \`${CB_BUCKET}\`" \
  || echo "(index may already exist)"

# Create secondary indexes for common queries
echo "=== Creating secondary indexes ==="
curl -sf -X POST "http://${CB_HOST}:8093/query/service" \
  -u "${CB_USER}:${CB_PASS}" \
  -d "statement=CREATE INDEX idx_type_store ON \`${CB_BUCKET}\`(type, store_id) WHERE type IS NOT MISSING" \
  || echo "(index may already exist)"

curl -sf -X POST "http://${CB_HOST}:8093/query/service" \
  -u "${CB_USER}:${CB_PASS}" \
  -d "statement=CREATE INDEX idx_type_user ON \`${CB_BUCKET}\`(type, user_id) WHERE type IS NOT MISSING" \
  || echo "(index may already exist)"

# Create a Sync Gateway RBAC user
echo "=== Creating Sync Gateway RBAC user ==="
curl -sf -X PUT "http://${CB_HOST}:8091/settings/rbac/users/local/sync_gateway" \
  -u "${CB_USER}:${CB_PASS}" \
  -d "password=syncpassword" \
  -d "roles=mobile_sync_gateway[${CB_BUCKET}]" \
  || echo "(user may already exist)"

echo "=== Couchbase initialization complete ==="
