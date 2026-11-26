import { createClient, type Client } from "@libsql/client";
import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Two library files with the same tables: corpus.db (IRS/FTB instructions and
 * publications) and law.db (the Internal Revenue Code, an optional download).
 * Set CORPUS_DB_PATH / LAW_DB_PATH so `mastra dev` and the CLIs agree on one
 * file: the module-relative default resolves differently inside Mastra's bundle.
 */
export type Library = "corpus" | "law";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATHS: Record<Library, string> = {
  corpus: resolve(MODULE_DIR, "../../.data/corpus.db"),
  law: resolve(MODULE_DIR, "../../.data/law.db"),
};
const DB_PATH_ENV: Record<Library, string> = { corpus: "CORPUS_DB_PATH", law: "LAW_DB_PATH" };

export function libraryDbPath(library: Library): string {
  const fromEnv = process.env[DB_PATH_ENV[library]];
  return fromEnv ? resolve(fromEnv) : DEFAULT_DB_PATHS[library];
}

export const corpusDbPath = (): string => libraryDbPath("corpus");

const clients = new Map<Library, Client>();
const schemaReady = new Map<Library, Promise<void>>();

export function getLibraryDb(library: Library): Client {
  const cached = clients.get(library);
  if (cached) return cached;
  const path = libraryDbPath(library);
  mkdirSync(dirname(path), { recursive: true });
  const client = createClient({ url: `file:${path}` });
  clients.set(library, client);
  return client;
}

export const getCorpusDb = (): Client => getLibraryDb("corpus");

// Every statement is IF NOT EXISTS, so it is safe on a prebuilt corpus.db.
const LIBRARY_SCHEMA_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS ref_documents (
           doc_id              TEXT PRIMARY KEY,
           title               TEXT NOT NULL,
           publisher           TEXT NOT NULL,
           tax_year            INTEGER,
           source_path         TEXT NOT NULL,
           source_url          TEXT,
           sha256              TEXT NOT NULL,
           total_pages         INTEGER NOT NULL,
           total_chars         INTEGER NOT NULL,
           -- 'pdf', 'html' (a cleaned publisher page), 'uslm' (US Code XML) or 'ecfr' (CFR XML); only a pdf has pages
           format              TEXT NOT NULL DEFAULT 'pdf',
           -- YYYY-MM-DD the publisher issued the source (sidecar "published"):
           -- when passages disagree, the newer document wins (askAnswerer)
           published           TEXT,
           canonical_text_path TEXT NOT NULL,
           ingested_at         TEXT NOT NULL DEFAULT (datetime('now'))
         )`,
  `CREATE TABLE IF NOT EXISTS ref_pages (
           doc_id     TEXT NOT NULL REFERENCES ref_documents(doc_id) ON DELETE CASCADE,
           page_num   INTEGER NOT NULL,
           char_start INTEGER NOT NULL,
           char_end   INTEGER NOT NULL,
           PRIMARY KEY (doc_id, page_num)
         )`,
  `CREATE TABLE IF NOT EXISTS ref_sections (
           section_id        TEXT PRIMARY KEY,
           doc_id            TEXT NOT NULL REFERENCES ref_documents(doc_id) ON DELETE CASCADE,
           heading           TEXT NOT NULL,
           heading_slug      TEXT NOT NULL,
           parent_section_id TEXT,
           ordinal           INTEGER NOT NULL,
           first_page        INTEGER NOT NULL,
           char_start        INTEGER NOT NULL,
           char_end          INTEGER NOT NULL
         )`,
  `CREATE INDEX IF NOT EXISTS idx_ref_sections_doc ON ref_sections(doc_id, ordinal)`,
  `CREATE TABLE IF NOT EXISTS ref_blocks (
           block_id            TEXT PRIMARY KEY,
           doc_id              TEXT NOT NULL REFERENCES ref_documents(doc_id) ON DELETE CASCADE,
           section_id          TEXT REFERENCES ref_sections(section_id) ON DELETE SET NULL,
           page_num            INTEGER NOT NULL,
           block_type          TEXT NOT NULL,
           ordinal             INTEGER NOT NULL,
           text                TEXT NOT NULL,
           char_start          INTEGER NOT NULL,
           char_end            INTEGER NOT NULL,
           metadata_json       TEXT,
           contextual_summary  TEXT,
           contextualized_text TEXT,
           block_text_sha1     TEXT,
           -- 768 = embeddinggemma-2. SQLite doesn't enforce the declared
           -- dim; ref_meta.embedding_model is the real cross-model guard.
           embedding           F32_BLOB(768)
         )`,
  `CREATE INDEX IF NOT EXISTS idx_ref_blocks_doc_ord ON ref_blocks(doc_id, ordinal)`,
  `CREATE INDEX IF NOT EXISTS idx_ref_blocks_section ON ref_blocks(section_id, ordinal)`,
  `CREATE INDEX IF NOT EXISTS idx_ref_blocks_page ON ref_blocks(doc_id, page_num)`,
  // FTS5 has no generated columns: writeDocument fills content itself.
  `CREATE VIRTUAL TABLE IF NOT EXISTS ref_blocks_fts USING fts5(
           block_id UNINDEXED,
           doc_id UNINDEXED,
           content,
           tokenize = 'porter unicode61'
         )`,
  // embedding_model here stops search from mixing vectors of two models.
  `CREATE TABLE IF NOT EXISTS ref_meta (
           key   TEXT PRIMARY KEY,
           value TEXT NOT NULL
         )`,
  // The source files are not committed, so corpus.db is the whole library.
  `CREATE TABLE IF NOT EXISTS ref_document_files (
           doc_id TEXT PRIMARY KEY REFERENCES ref_documents(doc_id) ON DELETE CASCADE,
           source BLOB NOT NULL
         )`,
];

/*
 * Columns added after a corpus release shipped. CREATE TABLE IF NOT EXISTS
 * leaves an older file's table alone, so add them here. Each one must be
 * nullable (SQLite refuses ADD COLUMN NOT NULL without a default); corpus
 * sync fills it.
 */
const ADDED_COLUMNS: { table: string; column: string; ddl: string }[] = [
  { table: "ref_documents", column: "published", ddl: "published TEXT" },
];

async function addMissingColumns(db: Client): Promise<void> {
  for (const { table, column, ddl } of ADDED_COLUMNS) {
    const cols = await db.execute(`PRAGMA table_info(${table})`);
    if (!cols.rows.some((row) => row.name === column)) {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    }
  }
}

export function ensureLibrarySchema(library: Library): Promise<void> {
  const ready = schemaReady.get(library);
  if (ready) return ready;
  const created = createSchema(library);
  schemaReady.set(library, created);
  return created;
}

export const ensureCorpusSchema = (): Promise<void> => ensureLibrarySchema("corpus");

/* The schema is ready before the client is handed out. */
export async function openLibraryDb(library: Library): Promise<Client> {
  await ensureLibrarySchema(library);
  return getLibraryDb(library);
}

async function createSchema(library: Library): Promise<void> {
  const db = getLibraryDb(library);
  // ON DELETE CASCADE needs this per connection; SQLite defaults it off.
  await db.execute("PRAGMA foreign_keys = ON");
  await db.batch(LIBRARY_SCHEMA_DDL, "write");
  await addMissingColumns(db);
  // The law library is optional, so only an empty corpus is worth a warning.
  if (library === "corpus" && (await documentCount(db)) === 0) {
    console.warn(
      "[corpus] reference corpus is EMPTY — grounding reviews will return " +
        "needs_more_facts. Run `npm run corpus -- fetch` (prebuilt) or " +
        "`npm run corpus -- sync` (rebuild, needs ANTHROPIC_API_KEY + Ollama).",
    );
  }
}

async function documentCount(db: Client): Promise<number> {
  const count = await db.execute(`SELECT count(*) AS n FROM ref_documents`);
  return Number(count.rows[0]?.n ?? 0);
}

/* Checks the file first: opening a missing law.db would create an empty one. */
export async function lawInstalled(): Promise<boolean> {
  if (!existsSync(libraryDbPath("law"))) return false;
  return (await documentCount(await openLibraryDb("law"))) > 0;
}
