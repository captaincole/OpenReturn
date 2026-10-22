import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getDocumentPdf } from "../mastra/db/corpusFiles";
import type { CorpusEntry } from "./walkCorpus";

/*
 * Make sure an entry's source PDF is on disk and is the file its sidecar
 * names (sha256). The PDFs are gitignored, so a missing one comes from,
 * in order:
 *   1. corpus.db, which stores every ingested PDF (ref_document_files).
 *      This keeps re-ingests working after a publisher replaces the file
 *      at its URL with a newer edition, as the IRS and FTB both do.
 *   2. The sidecar's sourceUrl — in practice only for a new document.
 * A sourceUrl mismatch means the publisher changed the file: point
 * sourceUrl at a stable copy (IRS: irs.gov/pub/irs-prior/<file>--<year>.pdf)
 * or, for a new edition on purpose, update the sidecar's sha256.
 */

const sha256 = (buf: Uint8Array) => createHash("sha256").update(buf).digest("hex");

export async function ensureSourcePdf(entry: CorpusEntry): Promise<Uint8Array> {
  const { sidecar, pdfPath, pdfRelPath } = entry;
  if (entry.pdfOnDisk) {
    const local = new Uint8Array(await readFile(pdfPath));
    if (sha256(local) === sidecar.sha256) return local;
    throw new Error(
      `${pdfRelPath} does not match its sidecar sha256. Update the sidecar for a new edition, or delete the file to re-download.`,
    );
  }
  const stored = await getDocumentPdf(sidecar.docId);
  const pdf = stored && sha256(stored) === sidecar.sha256 ? stored : await download(entry);
  await mkdir(dirname(pdfPath), { recursive: true });
  await writeFile(pdfPath, pdf);
  return pdf;
}

async function download({ sidecar, pdfRelPath }: CorpusEntry): Promise<Uint8Array> {
  if (!sidecar.sourceUrl) {
    throw new Error(
      `${pdfRelPath} is not on disk or in corpus.db, and its sidecar has no sourceUrl`,
    );
  }
  console.log(`  downloading ${sidecar.sourceUrl}`);
  const res = await fetch(sidecar.sourceUrl);
  if (!res.ok) throw new Error(`download failed (${res.status}): ${sidecar.sourceUrl}`);
  const pdf = new Uint8Array(await res.arrayBuffer());
  const got = sha256(pdf);
  if (got !== sidecar.sha256) {
    throw new Error(
      `${sidecar.sourceUrl} served a different file (sha256 ${got.slice(0, 12)}…, sidecar ${sidecar.sha256.slice(0, 12)}…)`,
    );
  }
  return pdf;
}
