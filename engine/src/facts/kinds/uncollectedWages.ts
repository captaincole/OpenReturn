/*
 * Form 8919: pay from a firm that treated the worker as an independent
 * contractor, withheld no social security or Medicare tax, and did not report
 * the pay on a W-2, when one of the form's reason codes applies
 * (irs-8919-form-2025::sec::omb-no-1545-0074::b01). One fact per firm: line 1
 * prints one row for each (irs-8919-form-2025::sec::lines-1-through-5::b01).
 * The taxpayer states each value; the pay often comes from the firm's Form
 * 1099-NEC or 1099-MISC.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * Column (c) (irs-8919-form-2025::sec::omb-no-1545-0074::b01, lines-1-through-5::b02):
 * A: a Form SS-8 determination letter says the worker is an employee.
 * C: other IRS correspondence says so (a "section 530 employee" too).
 * G: a Form SS-8 is filed and has no reply (also when no other code applies).
 * H: a W-2 and a 1099-MISC or 1099-NEC from the firm, and the 1099 amount is wages.
 */
export type UncollectedWagesReasonCode = "A" | "C" | "G" | "H";

export interface UncollectedWagesFactValue {
  /* Whose pay on a joint return: each spouse files a separate Form 8919. Required when joint. */
  owner?: "taxpayer" | "spouse";
  /* Column (a): the firm's name, exactly as on its Form 1099-MISC or 1099-NEC. */
  firmName: string;
  /* Column (b): the firm's EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX), or "unknown" when it cannot be had. */
  firmTin: string;
  /* Column (c): one reason code. */
  reasonCode: UncollectedWagesReasonCode;
  /* Column (d), MM/DD/YYYY: the date of the IRS determination or correspondence. Codes A and C only. */
  determinationDate?: string;
  /* Column (e): the firm sent a Form 1099-MISC or 1099-NEC for the pay. */
  received1099: boolean;
  /* Column (f): the pay with no social security or Medicare tax withheld and not on a W-2. */
  wages: number;
  /*
   * The 1099-NEC and 1099-MISC facts from this firm that hold this pay. They
   * belong to no business: Schedule C does not ask which business they are for.
   */
  form1099Keys?: string[];
}

export interface UncollectedWagesFact {
  key: string;
  value: UncollectedWagesFactValue;
}

const UNCOLLECTED_WAGES_CATEGORY = "wages";
const UNCOLLECTED_WAGES_PREFIX = "uncollected_wages.";

/* Codes A and C fill column (d) (irs-8919-form-2025::sec::lines-1-through-5::b03). */
export const CODES_WITH_DETERMINATION_DATE: ReadonlyArray<UncollectedWagesReasonCode> = ["A", "C"];

export function makeUncollectedWagesFactKey(firmSlug: string): string {
  return `${UNCOLLECTED_WAGES_PREFIX}${firmSlug}`;
}

export function isUncollectedWagesFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 2 && `${parts[0]}.` === UNCOLLECTED_WAGES_PREFIX && parts[1] !== "";
}

/* Every firm, in the order recorded: the order of the line 1 rows. */
export function getUncollectedWagesFacts(facts: ReadonlyArray<FactRow>): UncollectedWagesFact[] {
  return facts
    .filter((row) => row.category === UNCOLLECTED_WAGES_CATEGORY)
    .filter((row) => isUncollectedWagesFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as UncollectedWagesFactValue }));
}

/* The 1099 fact keys that a Form 8919 firm names as its pay. */
export function form1099KeysOnForm8919(facts: ReadonlyArray<FactRow>): Set<string> {
  return new Set(getUncollectedWagesFacts(facts).flatMap((fact) => fact.value.form1099Keys ?? []));
}
