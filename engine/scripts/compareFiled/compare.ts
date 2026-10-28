/* Blank and 0 are equal. A line the filed return leaves out is blank. */

import type { Catalog } from "../../src/catalog.js";
import type { AnyFormField, EvaluatedForm } from "../../src/types.js";

export type FiledReturn = Record<string, Record<string, number>>;

export type LineStatus =
  "not_modeled" | "blocked" | "engine_only" | "drift_1" | "drift_10" | "wrong";

export interface LineDiff {
  formId: string;
  fieldId: string;
  label: string;
  status: LineStatus;
  filed: number;
  engine: number | null;
}

export interface CompareResult {
  diffs: LineDiff[];
  /** Blank-and-blank is not a match. */
  matches: Record<string, string[]>;
  unknownFields: string[];
}

function engineValue(field: AnyFormField | undefined): number | null | "unsupported" {
  if (!field) return "unsupported";
  if (field.result.ok) return typeof field.result.value === "number" ? field.result.value : 0;
  return field.result.unsupported ? "unsupported" : null;
}

function classify(filed: number, engine: number | null | "unsupported"): LineStatus | null {
  if (engine === "unsupported") return filed === 0 ? null : "not_modeled";
  if (engine === null) return filed === 0 ? null : "blocked";
  const gap = Math.abs(filed - engine);
  if (gap < 0.005) return null;
  if (filed === 0) return "engine_only";
  if (gap <= 1) return "drift_1";
  if (gap <= 10) return "drift_10";
  return "wrong";
}

function compareForm(
  formId: string,
  form: EvaluatedForm<AnyFormField> | undefined,
  filedLines: Record<string, number>,
  catalog: Catalog,
  out: CompareResult,
): void {
  const numeric = catalog.getFields(formId).filter((f) => f.valueType === "numeric");
  const known = new Set(numeric.map((f) => f.fieldId));
  for (const id of Object.keys(filedLines)) {
    if (!known.has(id)) out.unknownFields.push(`[${formId}] ${id}`);
  }
  out.matches[formId] = [];
  for (const inv of numeric) {
    const filed = filedLines[inv.fieldId] ?? 0;
    const value = engineValue(form?.fields.find((f) => f.fieldId === inv.fieldId));
    const status = classify(filed, value);
    if (status === null) {
      if (filed !== 0) out.matches[formId].push(inv.fieldId);
      continue;
    }
    const engine = typeof value === "number" ? value : null;
    out.diffs.push({ formId, fieldId: inv.fieldId, label: inv.label, status, filed, engine });
  }
}

function engineFills(form: EvaluatedForm<AnyFormField> | undefined): boolean {
  if (!form?.mustFile.ok || form.mustFile.value !== true) return false;
  return form.fields.some((f) => f.valueType === "numeric" && f.result.ok && f.result.value !== 0);
}

export function compareFiled(opts: {
  formOrder: string[];
  forms: Map<string, EvaluatedForm<AnyFormField>>;
  filed: FiledReturn;
  catalog: Catalog;
  skip?: string[];
}): CompareResult {
  const out: CompareResult = { diffs: [], matches: {}, unknownFields: [] };
  const order = [
    ...opts.formOrder,
    ...Object.keys(opts.filed).filter((id) => !opts.formOrder.includes(id)),
  ];
  for (const formId of order) {
    if (opts.skip?.includes(formId)) continue;
    /* An empty entry (the template's default) means "not filed". */
    const filedLines = opts.filed[formId] ?? {};
    const form = opts.forms.get(formId);
    if (Object.keys(filedLines).length === 0 && !engineFills(form)) continue;
    compareForm(formId, form, filedLines, opts.catalog, out);
  }
  return out;
}
