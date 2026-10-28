/*
 * Source documents on disk: <taxYear>/forms/<relativeDir>/ (the engine's form
 * folder, e.g. federal/1040) and <taxYear>/publications/<jurisdiction>/<pub>/.
 */

import { resolve } from "node:path";

export const SOURCES_ROOT = __dirname;

export function formDir(taxYear: number, relativeDir: string): string {
  return resolve(__dirname, String(taxYear), "forms", relativeDir);
}
