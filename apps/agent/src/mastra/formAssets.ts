/*
 * Runtime loader for the blank PDFs the engine fills, and for the
 * instruction PDFs the reference library links to. scripts/syncForms.ts
 * copies both from @summa/forms into src/mastra/public/forms/<year>/
 * before dev and build (the tree is gitignored). Mastra's copyPublic step
 * ships that tree with the server, and the server runs with cwd at it
 * (src/mastra/public/ in dev, /var/task in prod).
 */

import type { BlankPdfLoader } from "@summa/engine";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const loadBlankPdf: BlankPdfLoader = ({ relativeDir, taxYear }) => {
  const path = resolve(process.cwd(), "forms", String(taxYear), relativeDir, "blank.pdf");
  if (!existsSync(path)) {
    throw new Error(`No blank PDF at ${path}. Run \`npm --prefix apps/agent run forms:sync\`.`);
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
 * names this corpus docId, or null.
 * It scans the runtime tree on each call: a few dozen small files, and
 * a forms:sync never leaves a stale cache behind.
 */
export async function loadInstructionsPdf(docId: string): Promise<Buffer | null> {
  const root = resolve(process.cwd(), "forms");
  if (!existsSync(root)) return null;
  const meta = metaFiles(root).find(
    (file) => (JSON.parse(readFileSync(file, "utf8")) as { docId?: string }).docId === docId,
  );
  const pdf = meta?.replace(/\.meta\.json$/, ".pdf");
  return pdf && existsSync(pdf) ? readFile(pdf) : null;
}
