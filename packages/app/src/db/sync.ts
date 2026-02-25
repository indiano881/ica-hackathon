/**
 * Sync Gateway replication configuration.
 *
 * Sets up continuous bidirectional replication between Couchbase Lite
 * and Couchbase Capella App Services (Sync Gateway).
 */

import {
  Replicator,
  ReplicatorConfiguration,
  URLEndpoint,
  ReplicatorType,
  BasicAuthenticator,
  ReplicatorActivityLevel,
  CollectionConfig,
  ReplicatorStatus,
} from "cbl-reactnative";
import { getDatabase } from "./couchbase";
import { Channel } from "@ica/shared";

// Sync Gateway endpoint — configure per environment
const SYNC_GATEWAY_URL = "wss://your-sync-gateway.example.com:4984/ica-checkout";

let replicator: Replicator | null = null;

export type SyncStatus = "idle" | "connecting" | "syncing" | "stopped" | "error";

export interface SyncState {
  status: SyncStatus;
  error?: string;
}

type SyncListener = (state: SyncState) => void;
const listeners: Set<SyncListener> = new Set();

export function addSyncListener(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(state: SyncState) {
  listeners.forEach((fn) => fn(state));
}

/**
 * Start continuous replication for a given user and store.
 */
export async function startSync(
  userId: string,
  storeId: string,
  username: string,
  password: string
): Promise<void> {
  if (replicator) {
    await stopSync();
  }

  const db = getDatabase();
  const collection = await db.defaultCollection();
  const target = new URLEndpoint(SYNC_GATEWAY_URL);

  const config = new ReplicatorConfiguration(target);
  config.setReplicatorType(ReplicatorType.PUSH_AND_PULL);
  config.setContinuous(true);
  config.setAuthenticator(new BasicAuthenticator(username, password));

  // Subscribe to user-specific and store product channels
  const collConfig = new CollectionConfig(
    [Channel.user(userId), Channel.storeProducts(storeId), Channel.globalPromos],
    null
  );
  config.addCollections([collection], collConfig);

  replicator = await Replicator.create(config);

  // Listen for replication status changes
  await replicator.addChangeListener((change) => {
    const repStatus = change.status as ReplicatorStatus;
    const activity = repStatus.getActivityLevel();
    let syncStatus: SyncStatus;

    switch (activity) {
      case ReplicatorActivityLevel.CONNECTING:
        syncStatus = "connecting";
        break;
      case ReplicatorActivityLevel.BUSY:
        syncStatus = "syncing";
        break;
      case ReplicatorActivityLevel.IDLE:
        syncStatus = "idle";
        break;
      case ReplicatorActivityLevel.STOPPED:
        syncStatus = "stopped";
        break;
      default:
        syncStatus = "error";
    }

    const errorMsg = repStatus.getError();
    notifyListeners({ status: syncStatus, error: errorMsg });
  });

  await replicator.start(false);
  console.log("[Sync] Replication started");
}

export async function stopSync(): Promise<void> {
  if (replicator) {
    await replicator.stop();
    replicator = null;
    console.log("[Sync] Replication stopped");
  }
}
