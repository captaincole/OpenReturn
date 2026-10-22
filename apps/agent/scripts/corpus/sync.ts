/*
 * Idempotent corpus sync. Walks the sidecars under packages/sources/
 * (instructions.meta.json under forms/, publication.meta.json under
 * publications/) and ingests anything missing or sha-drifted, downloading
 * the PDF from the sidecar's sourceUrl when it is not on disk. A
 * document that is already current costs one DB lookup, so the command
 * is cheap to run on every dev tick.
 *
 * The loop continues past per-doc failures, so one bad PDF does not
 * block the rest. The run exits non-zero at the end if any doc failed.
 * If a run dies at the embeddings step, `npm run corpus -- reembed`
 * finishes the job without re-paying for contextualization.
 */

import { parseArgs } from "node:util";
import { docIdsWithPdf, setDocumentPdf } from "../../src/mastra/db/corpusFiles";
import { getDocument } from "../../src/mastra/db/corpusStore";
import { ensureSourcePdf } from "../../src/refdocs/fetchSource";
import { ingestRefDoc } from "../../src/refdocs/ingest";
import { walkCorpus, type CorpusEntry } from "../../src/refdocs/walkCorpus";
import type { Command } from "../lib/cli";

type SyncAction = "ingested" | "replaced" | "stored" | "pdf-unavailable" | "skipped";

interface SyncResult {
  ok: { docId: string; action: SyncAction }[];
  failed: { docId: string; error: string }[];
  unconfigured: string[];
}

interface SyncFlags {
  force: boolean;
  noContextualize: boolean;
}

/*
 * One document. Current in corpus.db (same sha256 as the sidecar) → skip
 * without touching the PDF, unless its PDF is not stored yet ("stored":
 * a corpus ingested before ref_document_files existed). Otherwise fetch
 * the PDF if it is not on disk (refdocs/fetchSource.ts) and ingest. A
 * PDF that cannot be stored for a current document is a warning, not a
 * failure: the document is ingested and searchable, and `corpus status`
 * keeps listing it under "no PDF".
 */
async function syncOne(
  entry: CorpusEntry,
  flags: SyncFlags,
  stored: Set<string>,
): Promise<{ docId: string; action: SyncAction }> {
  const { docId } = entry.sidecar;
  const existing = await getDocument(docId);
  if (existing?.sha256 === entry.sidecar.sha256 && !flags.force) {
    if (stored.has(docId)) return { docId, action: "skipped" };
    try {
      await setDocumentPdf(docId, await ensureSourcePdf(entry));
      return { docId, action: "stored" };
    } catch (err) {
      console.warn(
        `  ! ${docId}: PDF not stored — ${err instanceof Error ? err.message : String(err)}`,
      );
      return { docId, action: "pdf-unavailable" };
    }
  }

  await ensureSourcePdf(entry);
  await ingestRefDoc({
    pdfPath: entry.pdfPath,
    docId,
    title: entry.sidecar.title,
    publisher: entry.sidecar.publisher,
    taxYear: entry.sidecar.taxYear,
    sourceUrl: entry.sidecar.sourceUrl,
    parserStyle: entry.sidecar.parserStyle,
    force: flags.force,
    noContextualize: flags.noContextualize,
  });
  return { docId, action: existing ? "replaced" : "ingested" };
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
  const stored = await docIdsWithPdf();
  for (const entry of walk.entries) {
    try {
      const r = await syncOne(entry, flags, stored);
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

  const count = (...actions: SyncAction[]) =>
    result.ok.filter((r) => actions.includes(r.action)).length;
  console.log(
    `\n[corpus sync] done: ${count("ingested", "replaced")} ingested/replaced, ${count("stored")} PDF stored, ${count("pdf-unavailable")} PDF unavailable, ${count("skipped")} skipped, ${result.failed.length} failed, ${result.unconfigured.length} unconfigured`,
  );

  if (result.failed.length > 0 || result.unconfigured.length > 0) {
    process.exit(1);
  }
}

export const syncCommand: Command = {
  name: "sync",
  summary:
    "Ingest new/changed source documents into corpus.db, downloading their PDFs as needed (idempotent)",
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
