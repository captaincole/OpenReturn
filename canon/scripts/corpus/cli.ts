/*
 * corpus — the RAG knowledge base, end to end. Gets instruction
 * documents into corpus.db (add-html/sync/ingest/status/reembed) and
 * operates on the db itself (fetch/check/search).
 *
 *   npm run corpus -- <command>       (or: npx tsx scripts/corpus/cli.ts)
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { runCli } from "../lib/cli";
import { addHtmlCommand } from "./addHtml";
import { checkCommand } from "./check";
import { fetchCommand } from "./fetch";
import { ingestCommand } from "./ingest";
import { reembedCommand } from "./reembed";
import { searchCommand } from "./search";
import { statusCommand } from "./status";
import { syncCommand } from "./sync";

/*
 * Same env files as Cade's and the builder's scripts: .env (personal
 * overrides) first, then .env.development (the file `mastra dev` reads,
 * written by scripts/bootstrap-env.mjs) fills the gaps. dotenv never overrides set
 * keys. Modules read the env at call time, so loading it here is early
 * enough.
 */
const CANON_ROOT = resolve(__dirname, "../..");
config({ path: resolve(CANON_ROOT, ".env"), quiet: true });
config({ path: resolve(CANON_ROOT, ".env.development"), quiet: true });

// runCli catches subcommand errors and exits itself — safe to not await.
void runCli({
  name: "corpus",
  bin: "npm run corpus --",
  description:
    "Reference corpus for RAG grounding: ingest instruction PDFs and pages, fetch/inspect/search corpus.db.",
  commands: [
    fetchCommand,
    syncCommand,
    addHtmlCommand,
    statusCommand,
    ingestCommand,
    reembedCommand,
    checkCommand,
    searchCommand,
  ],
});
