import { SOURCES_ROOT } from "@summa/sources";
import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import type { ParserStyle } from "./parse";

/*
 * Walks the @summa/sources tree (packages/sources/<year>/…) for source PDFs —
 * instructions.pdf (form instructions, under forms/) and
 * publication.pdf (an IRS/FTB publication, under publications/) — and
 * pairs each PDF with its sibling `<name>.meta.json` sidecar. The sidecar is the
 * source of truth for docId/title/publisher/taxYear/sourceUrl. The
 * filesystem is the source of truth for which docs should exist.
 *
 * A PDF without a sidecar is reported as `unconfigured`, not skipped.
 * A PDF without metadata is almost always a mistake. `blank.pdf` files
 * (fillable form templates) are ignored; the engine renders into them,
 * the corpus does not ingest them.
 */

export interface RefDocSidecar {
  docId: string;
  title: string;
  publisher: string;
  taxYear: number | null;
  sourceUrl: string | null;
  /*
   * Heading-detection style. The sidecar may set "parserStyle"
   * explicitly; otherwise it follows the publisher (FTB → "ftb").
   */
  parserStyle: ParserStyle;
}

export interface CorpusEntry {
  pdfPath: string; // absolute
  pdfRelPath: string; // relative to the forms root, for display
  sidecarPath: string; // absolute
  sidecar: RefDocSidecar;
  fileSha: string;
}

export interface WalkResult {
  entries: CorpusEntry[];
  unconfigured: { pdfPath: string; pdfRelPath: string; reason: string }[];
}

const SOURCE_FILENAMES = new Set(["instructions.pdf", "publication.pdf"]);

async function walkPdfs(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkPdfs(full)));
    } else if (entry.isFile() && SOURCE_FILENAMES.has(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

export async function walkCorpus(sourcesRoot: string = SOURCES_ROOT): Promise<WalkResult> {
  const root = resolve(sourcesRoot);
  const pdfPaths = await walkPdfs(root);

  const entries: CorpusEntry[] = [];
  const unconfigured: WalkResult["unconfigured"] = [];

  for (const pdfPath of pdfPaths) {
    const loaded = await loadEntry(root, pdfPath);
    if ("entry" in loaded) entries.push(loaded.entry);
    else unconfigured.push(loaded.unconfigured);
  }

  return { entries, unconfigured };
}

/*
 * Load one source PDF + sidecar pair. A missing / malformed /
 * incomplete sidecar makes the pdf "unconfigured" with a reason the
 * `corpus status` output shows verbatim.
 */
async function loadEntry(
  root: string,
  pdfPath: string,
): Promise<{ entry: CorpusEntry } | { unconfigured: WalkResult["unconfigured"][number] }> {
  const pdfRelPath = relative(root, pdfPath);
  const sidecarPath = pdfPath.replace(/\.pdf$/i, ".meta.json");
  const fail = (reason: string) => ({ unconfigured: { pdfPath, pdfRelPath, reason } });

  let sidecarText: string;
  try {
    sidecarText = await readFile(sidecarPath, "utf8");
  } catch {
    return fail(`missing sidecar ${relative(root, sidecarPath)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(sidecarText);
  } catch (e) {
    return fail(`sidecar JSON parse error: ${(e as Error).message}`);
  }

  const sidecar = coerceSidecar(parsed);
  if (!sidecar) {
    return fail("sidecar missing required fields (docId, title, publisher)");
  }

  const buf = await readFile(pdfPath);
  const fileSha = createHash("sha256").update(buf).digest("hex");

  return { entry: { pdfPath, pdfRelPath, sidecarPath, sidecar, fileSha } };
}

function coerceSidecar(v: unknown): RefDocSidecar | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (
    typeof o.docId !== "string" ||
    typeof o.title !== "string" ||
    typeof o.publisher !== "string"
  ) {
    return null;
  }
  const taxYear = typeof o.taxYear === "number" ? o.taxYear : null;
  const sourceUrl = typeof o.sourceUrl === "string" ? o.sourceUrl : null;
  const parserStyle: ParserStyle =
    o.parserStyle === "irs" || o.parserStyle === "ftb"
      ? o.parserStyle
      : o.publisher === "FTB"
        ? "ftb"
        : "irs";
  return {
    docId: o.docId,
    title: o.title,
    publisher: o.publisher,
    taxYear,
    sourceUrl,
    parserStyle,
  };
}
