import { parseArgs } from "node:util";
import { listBlocksWithoutEmbeddings } from "../../src/db/corpusStore";
import { lawLibrary } from "../../src/db/libsql";
import { ALL_JURISDICTIONS, jurisdictionSchema } from "../../src/jurisdiction";
import { embedLawBlocks, ingestLaw } from "../../src/law/ingestLaw";
import { requireLaw } from "../../src/law/lawRead";
import { walkLaw, type LawEntry } from "../../src/law/lawSidecar";
import type { Command } from "../lib/cli";
import { lawFetchCli } from "./lawFetch";

/*
 * The law commands that write the law files: sync, fetch, reembed. Each
 * document goes to the file of its jurisdiction (law/federal.db, law/ca.db).
 */

async function sync(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      force: { type: "boolean", default: false },
      doc: { type: "string", multiple: true },
    },
  });
  const force = values.force ?? false;
  const entries = selected(await walkLaw(), values.doc ?? []);
  console.log(`[law sync] processing ${entries.length} doc(s)`);
  let failed = 0;
  for (const entry of entries) {
    const started = Date.now();
    try {
      const result = await ingestLaw(entry, { force });
      const seconds = Math.round((Date.now() - started) / 1000);
      const counts = result.skipped
        ? "skipped"
        : `${result.blocks} blocks, ${result.embedded} embedded, ${seconds}s`;
      console.log(`  ✓ ${result.docId} (${counts})`);
      if (!result.skipped && result.embedded < result.blocks) failed += 1;
    } catch (err) {
      failed += 1;
      console.error(
        `  ✗ ${entry.sidecar.docId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  if (failed > 0) process.exit(1);
}

// `--doc cfr-26-2025` limits the sync; an unknown id is an error, not a silent no-op.
function selected(entries: LawEntry[], docIds: string[]): LawEntry[] {
  if (docIds.length === 0) return entries;
  const known = new Set(entries.map((entry) => entry.sidecar.docId));
  const unknown = docIds.filter((docId) => !known.has(docId));
  if (unknown.length > 0)
    throw new Error(`no law sidecar for ${unknown.join(", ")} (known: ${[...known].join(", ")})`);
  return entries.filter((entry) => docIds.includes(entry.sidecar.docId));
}

// Chunked like the sync, so a stop keeps the vectors made so far. Each installed file on its own.
async function reembed(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: { all: { type: "boolean", default: false }, jurisdiction: { type: "string" } },
  });
  const named = values.jurisdiction ? [jurisdictionSchema.parse(values.jurisdiction)] : undefined;
  let failed = false;
  for (const jurisdiction of await requireLaw(named ?? ALL_JURISDICTIONS)) {
    const library = lawLibrary(jurisdiction);
    const rows = await listBlocksWithoutEmbeddings({ all: values.all, library });
    if (rows.length === 0) {
      console.log(`[law reembed] ${jurisdiction}: no NULL-embedding blocks; nothing to do`);
      continue;
    }
    console.log(`[law reembed] ${jurisdiction}: ${rows.length} block(s)`);
    if ((await embedLawBlocks(library, rows)) < rows.length) failed = true;
  }
  if (failed) process.exit(1);
}

export const lawSyncCommand: Command = {
  name: "sync",
  summary:
    "Build each jurisdiction's law file from its pinned law.meta.json (sha-checked; skipped when unchanged)",
  options: [
    { flag: "--force", desc: "rebuild even if the sha matches (after a parser change)" },
    { flag: "--doc <docId>", desc: "only this document, e.g. cfr-26-2025 (repeatable)" },
  ],
  run: sync,
};

export const lawFetchCommand: Command = {
  name: "fetch",
  summary: "Install the prebuilt law files (one per jurisdiction) from seed/law.manifest.json",
  options: [
    { flag: "--jurisdiction federal|CA", desc: "install the file of this jurisdiction only" },
    { flag: "--force", desc: "replace an existing law file even if its sha differs" },
  ],
  run: lawFetchCli,
};

export const lawReembedCommand: Command = {
  name: "reembed",
  summary: "Embed the law blocks that have no vector (or --all after a model change)",
  options: [
    { flag: "--all", desc: "re-embed every block" },
    { flag: "--jurisdiction federal|CA", desc: "the file of this jurisdiction only" },
  ],
  run: reembed,
};
