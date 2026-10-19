/*
 * Runtime loader for the blank PDFs the engine fills. scripts/syncForms.ts
 * copies them from @summa/forms into src/mastra/public/forms/<year>/
 * before dev and build (the tree is gitignored). Mastra's copyPublic step
 * ships that tree with the server, and the server runs with cwd at it
 * (src/mastra/public/ in dev, /var/task in prod).
 */

import type { BlankPdfLoader } from "@summa/engine";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const loadBlankPdf: BlankPdfLoader = ({ relativeDir, taxYear }) => {
  const path = resolve(process.cwd(), "forms", String(taxYear), relativeDir, "blank.pdf");
  if (!existsSync(path)) {
    throw new Error(`No blank PDF at ${path}. Run \`npm --prefix apps/agent run forms:sync\`.`);
  }
  return readFile(path);
};
