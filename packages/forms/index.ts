/*
 * Where the source documents sit on disk. Layout:
 * <taxYear>/<relativeDir>/, where relativeDir is the form's folder
 * (federal/1040, state/ca/540). Offline tools read from here; the agent
 * copies the blank PDFs into its runtime tree (apps/agent
 * scripts/syncForms.ts).
 */

import { resolve } from "node:path";

export const FORMS_ROOT = __dirname;

/** The folder that holds one form's documents for one tax year. */
export function formDir(taxYear: number, relativeDir: string): string {
  return resolve(__dirname, String(taxYear), relativeDir);
}
