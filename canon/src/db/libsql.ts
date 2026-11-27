import { createClient, type Client } from "@libsql/client";
import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_JURISDICTIONS, type Jurisdiction } from "../jurisdiction";

/*
 * The library files, all with the same tables: corpus.db (IRS/FTB
 * instructions and publications), and one law file per jurisdiction
 * (optional downloads): law/federal.db holds the Internal Revenue Code and
 * the Treasury regulations, law/ca.db California's code. A new state is one
 * more file. Set CORPUS_DB_PATH / LAW_DB_DIR so `mastra dev` and the CLIs
 * agree on the files: the module-relative default resolves differently
 * inside Mastra's bundle.
 */
export type LawLibrary = `law:${Jurisdiction}`;
export type Library = "corpus" | LawLibrary;

const LAW_MARK = "law:";

/** The law file of one jurisdiction: "law:federal", "law:CA". */
export const lawLibrary = (jurisdiction: Jurisdiction): LawLibrary => `${LAW_MARK}${jurisdiction}`;

export const isLawLibrary = (library: Library): library is LawLibrary => library !== "corpus";

export const jurisdictionOfLibrary = (library: LawLibrary): Jurisdiction =>
  library.slice(LAW_MARK.length) as Jurisdiction;

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CORPUS_PATH = resolve(MODULE_DIR, "../../.data/corpus.db");
const DEFAULT_LAW_DIR = resolve(MODULE_DIR, "../../.data/law");

/** The folder of the law files. */
export function lawDbDir(): string {
  const fromEnv = process.env.LAW_DB_DIR;
  return fromEnv ? resolve(fromEnv) : DEFAULT_LAW_DIR;
}

/** "federal.db", "ca.db": the jurisdiction code in lower case. */
export const lawFileName = (jurisdiction: Jurisdiction): string =>
  `${jurisdiction.toLowerCase()}.db`;

export function libraryDbPath(library: Library): string {
  if (isLawLibrary(library)) return join(lawDbDir(), lawFileName(jurisdictionOfLibrary(library)));
  const fromEnv = process.env.CORPUS_DB_PATH;
  return fromEnv ? resolve(fromEnv) : DEFAULT_CORPUS_PATH;
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
           -- 'pdf', 'html' (a cleaned publisher page), 'uslm' (US Code XML), 'ecfr' (CFR XML) or 'caml' (California's code); only a pdf has pages
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

/*
 * Checks the file first: opening a missing law file would create an empty
 * one. With a jurisdiction, that jurisdiction's file; with none, any of them.
 */
export async function lawInstalled(jurisdiction?: Jurisdiction): Promise<boolean> {
  if (jurisdiction === undefined) return (await installedLawJurisdictions()).length > 0;
  if (!existsSync(libraryDbPath(lawLibrary(jurisdiction)))) return false;
  return (await documentCount(await openLibraryDb(lawLibrary(jurisdiction)))) > 0;
}

/** The jurisdictions of these (all unless named) whose law file holds a document, in table order. */
export async function installedLawJurisdictions(
  of: readonly Jurisdiction[] = ALL_JURISDICTIONS,
): Promise<Jurisdiction[]> {
  const installed: Jurisdiction[] = [];
  for (const jurisdiction of ALL_JURISDICTIONS)
    if (of.includes(jurisdiction) && (await lawInstalled(jurisdiction)))
      installed.push(jurisdiction);
  return installed;
}
