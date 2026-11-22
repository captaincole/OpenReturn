/*
 * Tip records: the cash and charge tips an employee received from one employer
 * in 2025, from the employee's daily tip record (Pub. 531, Keeping a Daily Tip
 * Record). One fact per employer; Form 4137 line 1 prints one row for each
 * (irs-4137-form-2025::sec::line-1::b01). The fact pairs with the employer's
 * W-2 fact by its slug: `employer.<slug>` is the W-2, `employer.<slug>.tips`
 * is this record.
 *
 * Without a tip record, an employer's W-2 box 8 (allocated tips) still counts:
 * Form 4137 takes it as the unreported tips "unless you can prove that your
 * unreported tips are less" (irs-4137-form-2025::sec::line-1::b02). A tip
 * record replaces that default for its employer.
 */

type FactRow = { key: string; value: unknown; category: string };

export interface TipsFactValue {
  /* Whose tips on a joint return. Without it, the employer's W-2 places the record. */
  owner?: "taxpayer" | "spouse";
  /* Column (a): the employer's name exactly as on the W-2. */
  employerName: string;
  /* Column (b): the EIN, or "Applied For", exactly as on the W-2. */
  employerEin: string;
  /* Column (c): every cash and charge tip received, reported or not, with allocated tips. */
  tipsReceived: number;
  /* Column (d): the cash and charge tips reported to the employer (usually W-2 box 7). */
  tipsReported: number;
  /* Line 5: the part of column (c) in months under $20 from this employer, not reported. */
  tipsUnder20InAMonth?: number;
  /* Line 10: the part of column (c) earned as a government employee whose pay owed only the 1.45% Medicare tax. */
  medicareOnlyGovernmentTips?: number;
  /* Form 1040 line 1c only: tickets, passes and other noncash tips (not on Form 4137). */
  noncashTips?: number;
}

export interface TipsFact {
  key: string;
  employerSlug: string;
  value: TipsFactValue;
}

const TIPS_CATEGORY = "wages";
const EMPLOYER_KEY_START = "employer";
const TIPS_KEY_END = "tips";

export function makeTipsFactKey(employerSlug: string): string {
  return `${EMPLOYER_KEY_START}.${employerSlug}.${TIPS_KEY_END}`;
}

export function isTipsFactKey(key: string): boolean {
  const parts = key.split(".");
  return parts.length === 3 && parts[0] === EMPLOYER_KEY_START && parts[2] === TIPS_KEY_END;
}

/* Every tip record, in the order the facts arrive. */
export function getTipsFacts(facts: ReadonlyArray<FactRow>): TipsFact[] {
  return facts
    .filter((fact) => fact.category === TIPS_CATEGORY && isTipsFactKey(fact.key))
    .map((fact) => ({
      key: fact.key,
      employerSlug: fact.key.split(".")[1],
      value: fact.value as TipsFactValue,
    }));
}
