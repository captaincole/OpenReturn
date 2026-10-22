/*
 * Where the source documents sit on disk. Layout, by document type:
 *   <taxYear>/forms/<relativeDir>/     one form's documents; relativeDir
 *                                      is the form's folder (federal/1040,
 *                                      state/ca/540), the same string the
 *                                      engine uses
 *   <taxYear>/publications/<jurisdiction>/<pub>/  IRS and FTB publications;
 *                                      jurisdiction is federal or state/<st>,
 *                                      as under forms/
 * Offline tools read from here; the agent copies the runtime files
 * (blank PDFs, instructions, publications) into its runtime tree (apps/agent
 * scripts/syncSources.ts).
 */

import { resolve } from "node:path";

export const SOURCES_ROOT = __dirname;

/** The folder that holds one form's documents for one tax year. */
export function formDir(taxYear: number, relativeDir: string): string {
  return resolve(__dirname, String(taxYear), "forms", relativeDir);
}
