export interface FieldResult {
  field: string;
  expected: unknown;
  got: unknown;
  ok: boolean;
}

type Flat = Record<string, unknown>;

/* Ids the model or the tool makes up; they are not on the document. */
const IGNORED_FIELDS = new Set(["tradeId"]);

const normText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/*
 * The tools treat an absent checkbox as false. A free-text description matches
 * when one contains the other.
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
    Object.entries(obj ?? {}).flatMap(([key, value]) =>
      IGNORED_FIELDS.has(key)
        ? []
        : value !== null && typeof value === "object"
          ? Object.entries(flattenObject(`${prefix}${key}.`, value))
          : [[`${prefix}${key}`, value]],
    ),
  );

type CodeAmount = { code: string; amount: number };
type LabelAmount = { label: string; amount: number };

/*
 * Box 14 labels vary by employer ("CA SDI" vs "SDI"), so box 14 is keyed by position
 * after a sort by amount. 1099-R uses box12/box14 as plain values.
 */
const flattenValue = (value: unknown): Flat => {
  const record = (value ?? {}) as Record<string, unknown>;
  const box12 = Array.isArray(record.box12) ? (record.box12 as CodeAmount[]) : [];
  const box14 = Array.isArray(record.box14) ? (record.box14 as LabelAmount[]) : [];
  const rest = Object.fromEntries(
    Object.entries(record).filter(
      ([key, fieldValue]) => !(["box12", "box14"].includes(key) && Array.isArray(fieldValue)),
    ),
  );
  return {
    ...flattenObject("", rest),
    ...Object.fromEntries(
      box12.map((entry) => [`box12.${entry.code.toUpperCase()}`, entry.amount]),
    ),
    ...Object.fromEntries(
      [...box14]
        .sort((left, right) => left.amount - right.amount)
        .map((entry, i) => [`box14[${i}].amount`, entry.amount]),
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
  fields.length ? fields.filter((field) => field.ok).length / fields.length : 0;
