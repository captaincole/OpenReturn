/*
 * Compare the engine's numeric lines against a filed return.
 *
 * Pure: takes the evaluated forms, the catalog, and the filed values;
 * returns one row per line that differs. Blank and 0 are equal. A line
 * the filed return leaves out is blank on the filed return.
 *
 * Rows come out in calculation order: forms in the given order (the
 * registry is upstreams-first), lines in catalog order. The first
 * mismatch row is the first place to look.
 */

import type { Catalog } from "../../src/catalog.js";
import type { AnyFormField, EvaluatedForm } from "../../src/types.js";

/** formId → fieldId → the amount on the filed return. */
export type FiledReturn = Record<string, Record<string, number>>;

export type LineStatus =
  /** The engine has no rule for a line the filed return fills. */
  | "not_modeled"
  /** The engine could not compute a line the filed return fills. */
  | "blocked"
  /** The engine fills a line the filed return leaves blank. */
  | "engine_only"
  /** Off by at most $1. */
  | "drift_1"
  /** Off by $2 to $10. */
  | "drift_10"
  /** Off by more than $10. */
  | "wrong";

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
  /** Filled lines that match, per form (field ids). Blank-and-blank is not a match. */
  matches: Record<string, string[]>;
  /** Filed fieldIds that are not in the catalog (typos). */
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

/** True when the engine files the form and fills at least one numeric line. */
function engineFills(form: EvaluatedForm<AnyFormField> | undefined): boolean {
  if (!form?.mustFile.ok || form.mustFile.value !== true) return false;
  return form.fields.some((f) => f.valueType === "numeric" && f.result.ok && f.result.value !== 0);
}

/**
 * Compare every form the filed return lists or the engine fills.
 * `formOrder` is the calculation order; `skip` drops forms the
 * comparison cannot line up (Form 8949 rows).
 */
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
