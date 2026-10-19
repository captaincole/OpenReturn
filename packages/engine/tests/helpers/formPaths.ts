/*
 * Where tests and scripts find each form's files on disk. The engine
 * itself reads no files (see BlankPdfLoader in src/index.ts), so
 * offline code resolves the paths here.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { BlankPdfLoader } from "../../src/index.js";
import type { FormSpec } from "../../src/registry.js";

import { ENGINE_ROOT, engineSrcDir } from "../../paths.js";

/** The form's catalog.json, next to its bindings. */
export function catalogPath(spec: FormSpec): string {
  return resolve(engineSrcDir, spec.relativeDir, "catalog.json");
}

/** The form's fillable blank PDF. */
export function blankPdfPath(spec: Pick<FormSpec, "relativeDir">): string {
  return resolve(ENGINE_ROOT, "../../apps/agent/forms", spec.relativeDir, "blank.pdf");
}

export const loadBlankPdf: BlankPdfLoader = (form) => readFile(blankPdfPath(form));
