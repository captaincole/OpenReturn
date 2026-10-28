/*
 * Resolve from cwd, not this module: Mastra's copyPublic ships src/mastra/public/
 * with the server and runs it there. scripts/syncSources.ts fills public/sources/.
 */

import type { BlankPdfLoader } from "@openreturn/engine";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
    throw new Error(`No blank PDF at ${path}. Run \`npm --prefix cade run sources:sync\`.`);
  }
  return readFile(path);
};
