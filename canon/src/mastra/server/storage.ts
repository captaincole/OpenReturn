import { InMemoryStore, MastraCompositeStore } from "@mastra/core/storage";
import { LibSQLStore } from "@mastra/libsql";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * A ground run's snapshot carries the facts Cade sent, so `npm run reset`
 * deletes this file. Keep it separate from corpus.db, which ships prebuilt.
 */
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = resolve(MODULE_DIR, "../../../.data/mastra.db");

export function mastraDbUrl(): string {
  const path = process.env.MASTRA_DB_PATH ? resolve(process.env.MASTRA_DB_PATH) : DEFAULT_DB_PATH;
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 }); // owner-only: tax data
  return `file:${path}`;
}

/* Observability stays in memory and resets on restart. */
export async function createStorage(): Promise<MastraCompositeStore> {
  const libsql = new LibSQLStore({ id: "canon-storage", url: mastraDbUrl() });
  const inMemory = new InMemoryStore({ id: "canon-inmemory" });
  return new MastraCompositeStore({
    id: "canon-composite",
    default: libsql,
    domains: { observability: await inMemory.getStore("observability") },
  });
}
