import { formDir } from "@openreturn/sources";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { engineSrcDir } from "../../paths.js";
import type { FormSpec } from "../../src/registry.js";

export function catalogPath(spec: Pick<FormSpec, "relativeDir">): string {
  return resolve(engineSrcDir, spec.relativeDir, "catalog.json");
}

export function catalogTaxYear(spec: Pick<FormSpec, "relativeDir">): number {
  return (JSON.parse(readFileSync(catalogPath(spec), "utf8")) as { form: { taxYear: number } }).form
    .taxYear;
}

export function blankPdfPath(form: { relativeDir: string; taxYear: number }): string {
  return resolve(formDir(form.taxYear, form.relativeDir), "blank.pdf");
}
