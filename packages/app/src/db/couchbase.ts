/**
 * Couchbase Lite initialization for the mobile app.
 *
 * Uses cbl-reactnative to create a local database that syncs
 * with Couchbase Capella via Sync Gateway.
 */

// cbl-reactnative types — adjust imports as the SDK evolves
import {
  Database,
  DatabaseConfiguration,
} from "cbl-reactnative";

const DB_NAME = "ica-checkout";

let database: Database | null = null;

export async function initDatabase(): Promise<Database> {
  if (database) return database;

  const config = new DatabaseConfiguration();
  database = new Database(DB_NAME, config);
  await database.open();

  console.log("[CouchbaseLite] Database opened:", DB_NAME);
  return database;
}

export function getDatabase(): Database {
  if (!database) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return database;
}

export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.close();
    database = null;
    console.log("[CouchbaseLite] Database closed");
  }
}
