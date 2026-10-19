/*
 * Where tests and scripts find each form's files on disk. The engine
 * itself reads no files (see BlankPdfLoader in src/engine/index.ts), so
 * offline code resolves the paths here.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BlankPdfLoader } from "../../src/engine/index.js";
import type { FormSpec } from "../../src/engine/registry.js";

const AGENT_ROOT = resolve(__dirname, "../..");

/** The form's catalog.json, next to its bindings. */
export function catalogPath(spec: FormSpec): string {
  return resolve(AGENT_ROOT, "src/engine", spec.relativeDir, "catalog.json");
}

/** The form's fillable blank PDF. */
export function blankPdfPath(spec: Pick<FormSpec, "relativeDir">): string {
  return resolve(AGENT_ROOT, "forms", spec.relativeDir, "blank.pdf");
}

export const loadBlankPdf: BlankPdfLoader = (form) => readFile(blankPdfPath(form));
