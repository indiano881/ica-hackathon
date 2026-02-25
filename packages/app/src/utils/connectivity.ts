import NetInfo from "@react-native-community/netinfo";

/**
 * Check if the device currently has internet connectivity.
 */
export async function isConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Subscribe to connectivity changes.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(
  callback: (connected: boolean) => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected ?? false);
  });
  return unsubscribe;
}
