/*
 * Field-by-field comparison of an extracted fact value against the
 * scenario's ground truth. Pure and deterministic: no LLM judge. Only
 * fields present in the ground truth are scored, so a scenario that leaves
 * a box out does not punish a model for reading it.
 */

export interface FieldResult {
  field: string;
  expected: unknown;
  got: unknown;
  ok: boolean;
}

type Flat = Record<string, unknown>;

/* Ids the model or the tool makes up; they are not on the document. */
const IGNORED_FIELDS = new Set(["tradeId"]);

const normText = (v: unknown): string =>
  String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/*
 * An unchecked checkbox may be left out: the tools treat absent as false.
 * A description is free text ("Front entry door" vs "Front entry door,
 * fiberglass"): it matches when one contains the other.
 */
const sameValue = (field: string, expected: unknown, got: unknown): boolean =>
  /description$/i.test(field) && got
    ? normText(got).includes(normText(expected)) || normText(expected).includes(normText(got))
    : typeof expected === "number"
      ? typeof got === "number" && Math.abs(expected - got) < 0.005
      : typeof expected === "boolean"
        ? expected === (got ?? false)
        : normText(expected) === normText(got);

const flattenObject = (prefix: string, obj: unknown): Flat =>
  Object.fromEntries(
    Object.entries(obj ?? {}).flatMap(([k, v]) =>
      IGNORED_FIELDS.has(k)
        ? []
        : v !== null && typeof v === "object"
          ? Object.entries(flattenObject(`${prefix}${k}.`, v))
          : [[`${prefix}${k}`, v]],
    ),
  );

type CodeAmount = { code: string; amount: number };
type LabelAmount = { label: string; amount: number };

/*
 * W-2 box 12 entries are keyed by code. Box 14 labels vary by employer
 * ("CA SDI" vs "SDI"), so box 14 is keyed by position after sorting by
 * amount. Other forms use box12/box14 as plain values (1099-R).
 */
const flattenValue = (value: unknown): Flat => {
  const v = (value ?? {}) as Record<string, unknown>;
  const box12 = Array.isArray(v.box12) ? (v.box12 as CodeAmount[]) : [];
  const box14 = Array.isArray(v.box14) ? (v.box14 as LabelAmount[]) : [];
  const rest = Object.fromEntries(
    Object.entries(v).filter(([k, x]) => !(["box12", "box14"].includes(k) && Array.isArray(x))),
  );
  return {
    ...flattenObject("", rest),
    ...Object.fromEntries(box12.map((e) => [`box12.${e.code.toUpperCase()}`, e.amount])),
    ...Object.fromEntries(
      [...box14]
        .sort((a, b) => a.amount - b.amount)
        .map((e, i) => [`box14[${i}].amount`, e.amount]),
    ),
  };
};

export function compareValues(truth: unknown, got: unknown): FieldResult[] {
  const gotFlat = got === undefined ? {} : flattenValue(got);
  return Object.entries(flattenValue(truth)).map(([field, expected]) => ({
    field,
    expected,
    got: gotFlat[field],
    ok: sameValue(field, expected, gotFlat[field]),
  }));
}

export const shareCorrect = (fields: FieldResult[]) =>
  fields.length ? fields.filter((f) => f.ok).length / fields.length : 0;
