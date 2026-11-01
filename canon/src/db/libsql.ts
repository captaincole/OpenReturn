import { createClient, type Client } from "@libsql/client";
import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * Set CORPUS_DB_PATH so `mastra dev` and the corpus CLI agree on one file:
 * the module-relative default resolves differently inside Mastra's bundle.
 */
const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = resolve(MODULE_DIR, "../../.data/corpus.db");

function corpusDbPath(): string {
  return process.env.CORPUS_DB_PATH ? resolve(process.env.CORPUS_DB_PATH) : DEFAULT_DB_PATH;
}

let cached: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function getCorpusDb(): Client {
  if (cached) return cached;
  const path = corpusDbPath();
  mkdirSync(dirname(path), { recursive: true });
  cached = createClient({ url: `file:${path}` });
  return cached;
}

// Every statement is IF NOT EXISTS, so it is safe on a prebuilt corpus.db.
const CORPUS_SCHEMA_DDL: string[] = [
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
           -- 'pdf', or 'html' (a cleaned publisher page, which has no pages)
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

export function ensureCorpusSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    const db = getCorpusDb();
    // ON DELETE CASCADE needs this per connection; SQLite defaults it off.
    await db.execute("PRAGMA foreign_keys = ON");
    await db.batch(CORPUS_SCHEMA_DDL, "write");
    await addMissingColumns(db);
    const count = await db.execute(`SELECT count(*) AS n FROM ref_documents`);
    if (Number(count.rows[0]?.n ?? 0) === 0) {
      console.warn(
        "[corpus] reference corpus is EMPTY — grounding reviews will return " +
          "needs_more_facts. Run `npm run corpus -- fetch` (prebuilt) or " +
          "`npm run corpus -- sync` (rebuild, needs ANTHROPIC_API_KEY + Ollama).",
      );
    }
  })();
  return schemaReady;
}
