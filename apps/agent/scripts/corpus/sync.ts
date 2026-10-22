/*
 * Idempotent corpus sync. Walks the source PDFs under forms/
 * (instructions.pdf, publication.pdf) and ingests anything missing or
 * sha-drifted. The ingest pipeline's own sha-skip handles re-runs with
 * unchanged PDFs, so the command is also cheap to run on every dev tick.
 *
 * The loop continues past per-doc failures, so one bad PDF does not
 * block the rest. The run exits non-zero at the end if any doc failed.
 * If a run dies at the embeddings step, `npm run corpus -- reembed`
 * finishes the job without re-paying for contextualization.
 */

import { parseArgs } from "node:util";
import { getDocument } from "../../src/mastra/db/corpusStore";
import { ingestRefDoc } from "../../src/refdocs/ingest";
import { walkCorpus, type CorpusEntry } from "../../src/refdocs/walkCorpus";
import type { Command } from "../lib/cli";

interface SyncResult {
  ok: { docId: string; action: "ingested" | "replaced" | "skipped" }[];
  failed: { docId: string; error: string }[];
  unconfigured: string[];
}

interface SyncFlags {
  force: boolean;
  noContextualize: boolean;
}

async function syncOne(
  entry: CorpusEntry,
  flags: SyncFlags,
): Promise<{
  docId: string;
  action: "ingested" | "replaced" | "skipped";
}> {
  const existing = await getDocument(entry.sidecar.docId);
  const willReplace = !!existing && existing.sha256 !== entry.fileSha;

  const result = await ingestRefDoc({
    pdfPath: entry.pdfPath,
    docId: entry.sidecar.docId,
    title: entry.sidecar.title,
    publisher: entry.sidecar.publisher,
    taxYear: entry.sidecar.taxYear,
    sourceUrl: entry.sidecar.sourceUrl,
    parserStyle: entry.sidecar.parserStyle,
    force: flags.force,
    noContextualize: flags.noContextualize,
  });

  if (result.skipped) {
    return { docId: entry.sidecar.docId, action: "skipped" };
  }
  return {
    docId: entry.sidecar.docId,
    action: willReplace ? "replaced" : "ingested",
  };
}

async function run(argv: string[]): Promise<void> {
  const { values } = parseArgs({
    args: argv,
    options: {
      force: { type: "boolean", default: false },
      "no-contextualize": { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const flags: SyncFlags = { force: values.force, noContextualize: values["no-contextualize"] };
  const walk = await walkCorpus();
  const result: SyncResult = { ok: [], failed: [], unconfigured: [] };

  for (const u of walk.unconfigured) {
    console.warn(`[corpus sync] unconfigured: ${u.pdfRelPath} — ${u.reason}`);
    result.unconfigured.push(u.pdfRelPath);
  }

  console.log(`[corpus sync] processing ${walk.entries.length} doc(s)`);
  for (const entry of walk.entries) {
    try {
      const r = await syncOne(entry, flags);
      result.ok.push(r);
      console.log(`  ✓ ${r.docId} (${r.action})`);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null
            ? JSON.stringify(err)
            : String(err);
      result.failed.push({ docId: entry.sidecar.docId, error: msg });
      console.error(`  ✗ ${entry.sidecar.docId}: ${msg}`);
    }
  }

  const ingested = result.ok.filter((r) => r.action !== "skipped").length;
  const skipped = result.ok.filter((r) => r.action === "skipped").length;
  console.log(
    `\n[corpus sync] done: ${ingested} ingested/replaced, ${skipped} skipped, ${result.failed.length} failed, ${result.unconfigured.length} unconfigured`,
  );

  if (result.failed.length > 0 || result.unconfigured.length > 0) {
    process.exit(1);
  }
}

export const syncCommand: Command = {
  name: "sync",
  summary:
    "Ingest new/sha-drifted sources/**/{instructions,publication}.pdf into corpus.db (idempotent)",
  options: [
    {
      flag: "--force",
      desc: "re-ingest every doc even if its sha matches (after a parser change)",
    },
    {
      flag: "--no-contextualize",
      desc: "skip the Haiku contextualization stage (parser iteration)",
    },
  ],
  run,
};
