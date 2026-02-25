import { useCallback } from "react";
import { DocKey, type Product } from "@ica/shared";
import { Parameters } from "cbl-reactnative";
import { getDatabase } from "../db/couchbase";

/**
 * Hook for querying products from the local Couchbase Lite database.
 * Products are synced from server via Sync Gateway (read-only on device).
 */
export function useProducts(storeId: string) {
  const getProduct = useCallback(
    async (ean: string): Promise<Product | null> => {
      try {
        const db = getDatabase();
        const collection = await db.defaultCollection();
        const key = DocKey.product(storeId, ean);
        const doc = await collection.getDocument(key);
        if (!doc) return null;
        return doc.getData() as unknown as Product;
      } catch (err) {
        console.error("Failed to get product:", err);
        return null;
      }
    },
    [storeId]
  );

  const getAllProducts = useCallback(async (): Promise<Product[]> => {
    try {
      const db = getDatabase();
      const query = db.createQuery(
        "SELECT * FROM _ WHERE type = 'product' AND store_id = $storeId"
      );
      const params = new Parameters();
      params.setString("storeId", storeId);
      query.parameters = params;
      const results = await query.execute();
      return results.map((row: any) => row as Product);
    } catch (err) {
      console.error("Failed to query products:", err);
      return [];
    }
  }, [storeId]);

  return { getProduct, getAllProducts };
}
