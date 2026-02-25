import { useState, useCallback } from "react";
import { DocKey, type User } from "@ica/shared";
import { MutableDocument } from "cbl-reactnative";
import { getDatabase } from "../db/couchbase";

/**
 * Hook for user authentication and session management.
 * User profile is cached locally in Couchbase Lite.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (userId: string) => {
    try {
      const db = getDatabase();
      const collection = await db.defaultCollection();
      const key = DocKey.user(userId);

      try {
        const doc = await collection.getDocument(key);
        if (doc) {
          setUser(doc.getData() as unknown as User);
          return;
        }
      } catch {
        // Document not found — create a new one
      }

      // Create a basic local user profile (will sync from server)
      const newUser: User = {
        type: "user",
        user_id: userId,
        name: userId,
        email: "",
        loyalty_tier: "bronze",
        points_balance: 0,
        payment_preauth: null,
        store_id: "store_042",
        synced_at: null,
      };
      const mutableDoc = new MutableDocument(key);
      mutableDoc.setData(newUser as unknown as Record<string, unknown>);
      await collection.save(mutableDoc);
      setUser(newUser);
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return { user, login, logout };
}
