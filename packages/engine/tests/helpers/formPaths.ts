/*
 * Where tests and scripts find each form's files on disk. The engine
 * itself reads no files (see BlankPdfLoader in src/index.ts), so
 * offline code resolves the paths here.
 */

import { formDir } from "@summa/forms";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { engineSrcDir } from "../../paths.js";
import type { FormSpec } from "../../src/registry.js";

/** The form's catalog.json, next to its bindings. */
export function catalogPath(spec: Pick<FormSpec, "relativeDir">): string {
  return resolve(engineSrcDir, spec.relativeDir, "catalog.json");
}

/** The tax year a form's catalog was built from. */
export function catalogTaxYear(spec: Pick<FormSpec, "relativeDir">): number {
  return (JSON.parse(readFileSync(catalogPath(spec), "utf8")) as { form: { taxYear: number } }).form
    .taxYear;
}

/** The form's fillable blank PDF for one tax year, from @summa/forms. */
export function blankPdfPath(form: { relativeDir: string; taxYear: number }): string {
  return resolve(formDir(form.taxYear, form.relativeDir), "blank.pdf");
}
