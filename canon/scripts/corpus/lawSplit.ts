import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { deleteDocument, listDocuments } from "../../src/db/corpusStore";
import { lawLibrary, libraryDbPath, openLibraryDb } from "../../src/db/libsql";
import { ALL_JURISDICTIONS, jurisdictionOfLawId, type Jurisdiction } from "../../src/jurisdiction";
import type { Command } from "../lib/cli";

/*
 * `law split <law.db>`: the one law file of release law-v2 and older, split
 * into one file per jurisdiction with no new embeddings. Each file is a copy
 * of the old one with the other jurisdictions' documents deleted (their FTS
 * rows too), then compacted. A file that exists is left alone.
 */

async function split(argv: string[]): Promise<void> {
  const [from] = argv;
  if (!from) throw new Error("required: the path of the old law.db");
  const source = resolve(from);
  if (!existsSync(source)) throw new Error(`${source} does not exist`);
  for (const jurisdiction of ALL_JURISDICTIONS) await splitOne(source, jurisdiction);
}

async function splitOne(source: string, jurisdiction: Jurisdiction): Promise<void> {
  const library = lawLibrary(jurisdiction);
  const target = libraryDbPath(library);
  if (existsSync(target)) {
    console.log(`[law split] ${target} exists: left alone`);
    return;
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  const documents = await listDocuments(library);
  const others = documents.filter((doc) => jurisdictionOfLawId(doc.docId) !== jurisdiction);
  for (const doc of others) await deleteDocument(doc.docId, library);
  const db = await openLibraryDb(library);
  // Deleted FTS rows stay in the index segments until a merge: optimize, then compact the file.
  await db.execute(`INSERT INTO ref_blocks_fts(ref_blocks_fts) VALUES ('optimize')`);
  await db.execute("VACUUM");
  const kept = documents.filter((doc) => !others.includes(doc)).map((doc) => doc.docId);
  console.log(`[law split] ${jurisdiction}: ${target} holds ${kept.join(", ") || "nothing"}`);
}

export const lawSplitCommand: Command = {
  name: "split",
  summary: "Split an old single law.db into one file per jurisdiction (no re-embedding)",
  usage: "<law.db>",
  run: split,
};
