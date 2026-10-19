/*
 * Runtime loader for the blank PDFs the engine fills. Mastra's
 * copyPublic step ships src/mastra/public/forms/** with the server, and
 * the server runs with cwd at that public tree (src/mastra/public/ in
 * dev, /var/task in prod). So forms/<relativeDir>/blank.pdf resolves in
 * both.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BlankPdfLoader } from "../engine";

export const loadBlankPdf: BlankPdfLoader = ({ relativeDir }) =>
  readFile(resolve(process.cwd(), "forms", relativeDir, "blank.pdf"));
