import { parseArgs } from "node:util";
import { docIdsWithSource, getDocumentSource, setDocumentSource } from "../../src/db/corpusFiles";
import { getDocument, setDocumentPublished, type RefDocument } from "../../src/db/corpusStore";
import { pdfPublished } from "../../src/refdocs/extract";
import { ensureSourceFile } from "../../src/refdocs/fetchSource";
import { ingestRefDoc } from "../../src/refdocs/ingest";
import { walkCorpus, type CorpusEntry } from "../../src/refdocs/walkCorpus";
import type { Command } from "../lib/cli";

type SyncAction = "ingested" | "replaced" | "stored" | "dated" | "source-unavailable" | "skipped";

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
 * A current document whose source file cannot be stored is a warning, not a
 * failure: it is still searchable.
 */
async function syncOne(
  entry: CorpusEntry,
  flags: SyncFlags,
  stored: Set<string>,
): Promise<{ docId: string; action: SyncAction }> {
  const { docId } = entry.sidecar;
  const existing = await getDocument(docId);
  if (existing?.sha256 === entry.sidecar.sha256 && !flags.force) {
    if (stored.has(docId)) {
      return { docId, action: (await redate(entry, existing)) ? "dated" : "skipped" };
    }
    try {
      await setDocumentSource(docId, await ensureSourceFile(entry));
      return { docId, action: "stored" };
    } catch (err) {
      console.warn(
        `  ! ${docId}: source file not stored — ${err instanceof Error ? err.message : String(err)}`,
      );
      return { docId, action: "source-unavailable" };
    }
  }

  await ensureSourceFile(entry);
  await ingestRefDoc({
    sourcePath: entry.sourcePath,
    format: entry.sidecar.format,
    docId,
    title: entry.sidecar.title,
    publisher: entry.sidecar.publisher,
    taxYear: entry.sidecar.taxYear,
    sourceUrl: entry.sidecar.sourceUrl,
    published: entry.sidecar.published,
    parserStyle: entry.sidecar.parserStyle,
    force: flags.force,
    noContextualize: flags.noContextualize,
  });
  return { docId, action: existing ? "replaced" : "ingested" };
}

async function redate(entry: CorpusEntry, existing: RefDocument): Promise<boolean> {
  let published = entry.sidecar.published;
  if (!published) {
    // A cleaned page keeps no date: an HTML document's comes only from its sidecar.
    if (existing.published || existing.format !== "pdf") return false;
    const source = await getDocumentSource(existing.docId);
    published = source && (await pdfPublished(source));
  }
  if (!published || published === existing.published) return false;
  await setDocumentPublished(existing.docId, published);
  return true;
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

  for (const source of walk.unconfigured) {
    console.warn(`[corpus sync] unconfigured: ${source.sourceRelPath} — ${source.reason}`);
    result.unconfigured.push(source.sourceRelPath);
  }

  console.log(`[corpus sync] processing ${walk.entries.length} doc(s)`);
  const stored = await docIdsWithSource();
  for (const entry of walk.entries) {
    try {
      const synced = await syncOne(entry, flags, stored);
      result.ok.push(synced);
      console.log(`  ✓ ${synced.docId} (${synced.action})`);
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
    result.ok.filter((synced) => actions.includes(synced.action)).length;
  console.log(
    `\n[corpus sync] done: ${count("ingested", "replaced")} ingested/replaced, ${count("stored")} source stored, ${count("dated")} dated, ${count("source-unavailable")} source unavailable, ${count("skipped")} skipped, ${result.failed.length} failed, ${result.unconfigured.length} unconfigured`,
  );

  if (result.failed.length > 0 || result.unconfigured.length > 0) {
    process.exit(1);
  }
}

export const syncCommand: Command = {
  name: "sync",
  summary:
    "Ingest new/changed source documents into corpus.db, fetching their PDFs or HTML pages as needed (idempotent)",
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
