/*
 * Runtime loader for the blank PDFs the engine fills, and for the
 * instruction and publication PDFs the reference library links to.
 * scripts/syncSources.ts copies them from @summa/sources into
 * src/mastra/public/sources/ before dev and build (the tree is
 * gitignored). Mastra's copyPublic step
 * ships that tree with the server, and the server runs with cwd at it
 * (src/mastra/public/ in dev, /var/task in prod).
 */

import type { BlankPdfLoader } from "@summa/engine";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const loadBlankPdf: BlankPdfLoader = ({ relativeDir, taxYear }) => {
  const path = resolve(
    process.cwd(),
    "sources",
    String(taxYear),
    "forms",
    relativeDir,
    "blank.pdf",
  );
  if (!existsSync(path)) {
    throw new Error(`No blank PDF at ${path}. Run \`npm --prefix apps/agent run sources:sync\`.`);
  }
  return readFile(path);
};

function metaFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return metaFiles(full);
    return /^(instructions|publication)\.meta\.json$/.test(entry.name) ? [full] : [];
  });
}

/*
 * The source PDF (instructions.pdf or publication.pdf) whose sidecar
 * names this corpus docId, or null. It scans the runtime tree on each
 * call: a few dozen small files, and a sources:sync never leaves a stale
 * cache behind.
 */
export async function loadSourcePdf(docId: string): Promise<Buffer | null> {
  const root = resolve(process.cwd(), "sources");
  if (!existsSync(root)) return null;
  const meta = metaFiles(root).find(
    (file) => (JSON.parse(readFileSync(file, "utf8")) as { docId?: string }).docId === docId,
  );
  const pdf = meta?.replace(/\.meta\.json$/, ".pdf");
  return pdf && existsSync(pdf) ? readFile(pdf) : null;
}
