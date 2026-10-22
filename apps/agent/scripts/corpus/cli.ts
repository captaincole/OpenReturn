/*
 * corpus — the RAG knowledge base, end to end. Gets instruction
 * documents into corpus.db (add-html/sync/ingest/status/reembed) and
 * operates on the db itself (fetch/check/search).
 *
 *   npm run corpus -- <command>       (or: npx tsx scripts/corpus/cli.ts)
 */

import "dotenv/config";
import { runCli } from "../lib/cli";
import { addHtmlCommand } from "./addHtml";
import { checkCommand } from "./check";
import { fetchCommand } from "./fetch";
import { ingestCommand } from "./ingest";
import { reembedCommand } from "./reembed";
import { searchCommand } from "./search";
import { statusCommand } from "./status";
import { syncCommand } from "./sync";

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
