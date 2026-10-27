import { InMemoryStore, MastraCompositeStore } from "@mastra/core/storage";
import { LibSQLStore } from "@mastra/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Mastra runtime storage for Canon (workflow snapshots, traces). Canon
 * keeps no user data of its own, but a ground run's snapshot carries the
 * decision and facts Cade sent, so `npm run reset` deletes this file with
 * Cade's (canon reset:data); deleting it loses nothing but Studio
 * history. It is separate from corpus.db, which is the library and ships
 * prebuilt.
 *
 * Path: MASTRA_DB_PATH env wins (Canon's own .env.development), else
 * <canon>/.data/mastra.db anchored to this module.
 */

const MODULE_DIR = dirname(fileURLToPath(import.meta.url)); // …/src/mastra/server
const DEFAULT_DB_PATH = resolve(MODULE_DIR, "../../../.data/mastra.db");

export function mastraDbUrl(): string {
  const path = process.env.MASTRA_DB_PATH ? resolve(process.env.MASTRA_DB_PATH) : DEFAULT_DB_PATH;
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); // owner-only: tax data
  return `file:${path}`;
}

/* LibSQLStore for everything, InMemoryStore for observability (resets on restart). */
export async function createStorage(): Promise<MastraCompositeStore> {
  const libsql = new LibSQLStore({ id: "canon-storage", url: mastraDbUrl() });
  const inMemory = new InMemoryStore({ id: "canon-inmemory" });
  return new MastraCompositeStore({
    id: "canon-composite",
    default: libsql,
    domains: { observability: await inMemory.getStore("observability") },
  });
}
