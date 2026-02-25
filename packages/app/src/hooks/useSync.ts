import { useState, useEffect } from "react";
import { addSyncListener, type SyncStatus, type SyncState } from "../db/sync";

/**
 * Hook to monitor Couchbase Lite replication status.
 */
export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("stopped");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = addSyncListener((state: SyncState) => {
      setStatus(state.status);
      setError(state.error);
    });

    return unsubscribe;
  }, []);

  return { status, error };
}
