import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getDocumentSource } from "../mastra/db/corpusFiles";
import { cleanFtbHtml } from "./html/cleanFtb";
import type { CorpusEntry } from "./walkCorpus";

/*
 * Make sure an entry's source file is on disk and is the file its sidecar
 * names (sha256). Source files are gitignored, so a missing one comes
 * from, in order:
 *   1. corpus.db, which stores every ingested source (corpusFiles.ts).
 *      This keeps re-ingests working after a publisher replaces the file
 *      at its URL with a newer edition, as the IRS and FTB both do.
 *   2. The sidecar's sourceUrl — in practice only for a new document. An
 *      HTML source is the cleaned page, so its sha256 is the cleaner's
 *      output (refdocs/html/cleanFtb.ts), not the raw download.
 * A sourceUrl mismatch means the publisher changed the file (or, for
 * HTML, the cleaner changed): point sourceUrl at a stable copy (IRS:
 * irs.gov/pub/irs-prior/<file>--<year>.pdf) or, for a new edition on
 * purpose, update the sidecar's sha256 (`corpus add-html` rewrites it).
 */

/* Some publisher CDNs reject requests without a browser user agent. */
export const FETCH_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
};

export const sha256 = (buf: Uint8Array) => createHash("sha256").update(buf).digest("hex");

export async function ensureSourceFile(entry: CorpusEntry): Promise<Uint8Array> {
  const { sidecar, sourcePath, sourceRelPath } = entry;
  if (entry.sourceOnDisk) {
    const local = new Uint8Array(await readFile(sourcePath));
    if (sha256(local) === sidecar.sha256) return local;
    throw new Error(
      `${sourceRelPath} does not match its sidecar sha256. Update the sidecar for a new edition, or delete the file to fetch it again.`,
    );
  }
  const stored = await getDocumentSource(sidecar.docId);
  const file = stored && sha256(stored) === sidecar.sha256 ? stored : await download(entry);
  await mkdir(dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, file);
  return file;
}

async function download({ sidecar, sourceRelPath }: CorpusEntry): Promise<Uint8Array> {
  if (!sidecar.sourceUrl) {
    throw new Error(
      `${sourceRelPath} is not on disk or in corpus.db, and its sidecar has no sourceUrl`,
    );
  }
  console.log(`  downloading ${sidecar.sourceUrl}`);
  const file =
    sidecar.format === "html"
      ? new TextEncoder().encode((await fetchCleanHtml(sidecar.sourceUrl)).html)
      : await fetchBytes(sidecar.sourceUrl);
  const got = sha256(file);
  if (got !== sidecar.sha256) {
    throw new Error(
      `${sidecar.sourceUrl} served a different file (sha256 ${got.slice(0, 12)}…, sidecar ${sidecar.sha256.slice(0, 12)}…)`,
    );
  }
  return file;
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`download failed (${res.status}): ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/* Download a publisher page and clean it (images inlined). */
export async function fetchCleanHtml(url: string): Promise<{ html: string; title: string }> {
  const raw = new TextDecoder().decode(await fetchBytes(url));
  return cleanFtbHtml(raw, url, async (imageUrl) => {
    const res = await fetch(imageUrl, { headers: FETCH_HEADERS });
    if (!res.ok) throw new Error(`image download failed (${res.status}): ${imageUrl}`);
    const type = res.headers.get("content-type") ?? "image/png";
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  });
}
