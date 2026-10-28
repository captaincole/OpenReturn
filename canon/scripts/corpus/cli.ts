// npm run corpus -- <command>
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
 * .env (personal overrides) first, then .env.development fills the gaps:
 * dotenv never overrides a set key. This runs after the imports, so modules
 * must read env at call time.
 */
const CANON_ROOT = resolve(__dirname, "../..");
config({ path: resolve(CANON_ROOT, ".env"), quiet: true });
config({ path: resolve(CANON_ROOT, ".env.development"), quiet: true });

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
