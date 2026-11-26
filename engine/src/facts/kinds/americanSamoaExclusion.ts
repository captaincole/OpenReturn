/*
 * Form 4563: the income a bona fide resident of American Samoa excludes from
 * gross income (irs-4563-form-2025::sec::omb-no-1545-0074::b02, "Purpose of
 * form"). One fact per person who excludes income: Part I describes that
 * person's own residence, and the header carries "Your social security
 * number". The taxpayer states each answer; no one document holds them.
 *
 * The amounts are the income that qualifies: "only income that is from sources
 * within American Samoa or effectively connected with the conduct of a trade or
 * business in American Samoa" (part-ii-figure-your-exclusion::b01), never pay
 * from the U.S. Government (omb-no-1545-0074::b02). Excluded income is never on
 * Form 1040: "You must report on your tax return your worldwide income for the
 * tax year that does not qualify for the exclusion"
 * (filing-form-1040-or-1040-sr::b01). So the documents of this income (a Form
 * W-2AS, a statement of an American Samoa bank) are recorded here, not as a
 * W-2 or 1099 fact, and this fact adds no income to Form 1040.
 *
 * Amounts are in U.S. dollars, the currency of American Samoa. Dates are
 * "MM/DD/YYYY".
 */

type FactRow = { key: string; value: unknown; category: string };

/* Line 2: the kind of living quarters; the form has four boxes. */
export type AmericanSamoaLivingQuarters =
  "rented_room" | "rented_house" | "employer_quarters" | "purchased_home";

/* Line 6: one absence from American Samoa during 2025. */
export interface AmericanSamoaAbsence {
  /* Column (a). */
  left: string;
  /* Column (b). */
  returned: string;
  /* Column (d). */
  reason: string;
}

/*
 * Lines 10 to 13: a net amount (a loss is below 0) and its gross income. The
 * standard deduction is shared by gross income, and "Gross income from a
 * business means, for example, the amount on Schedule C, line 7, or Schedule
 * F, line 9 ... do not reduce your income by any losses" (Pub. 570, Table 4-1,
 * note **). For a capital gain the gross income is the gains, before any loss;
 * for rental real estate and royalties it is the rents and royalties received.
 */
export interface AmericanSamoaNetIncome {
  amount: number;
  grossIncome: number;
}

/* Line 14: one kind of other income, with the words the form prints. */
export interface AmericanSamoaOtherIncome {
  description: string;
  amount: number;
}

/* Line 7: wages from Form W-2AS. */
export interface AmericanSamoaWages {
  /* Box 1, the wages, salaries and tips earned in American Samoa. */
  amount: number;
  /* Box 5, the Medicare wages: Form 8959 counts a Form W-2AS as a Form W-2 (irs-8959-inst-2025::sec::future-developments::b01). */
  medicareWages: number;
}

export interface AmericanSamoaExclusionFactValue {
  /*
   * Who qualifies: a bona fide resident of American Samoa "for the entire tax
   * year" (irs-4563-form-2025::sec::omb-no-1545-0074::b02), or one "considered
   * a bona fide resident ... under the special rules for the year of a move"
   * (filing-form-1040-or-1040-sr::b02).
   * False files no Form 4563: the income then goes on the return as usual.
   */
  bonaFideResidentAllYear: boolean;
  /*
   * A U.S. citizen or resident. A nonresident alien is "not allowed the
   * standard deduction" and other deductions and credits (Pub. 570, chapter 3;
   * filing-form-1040-or-1040-sr::b02, the caution).
   */
  usCitizenOrResident: boolean;
  /* Line 1. */
  residenceBegan: string;
  /* Line 1; absent prints "Continues". */
  residenceEnded?: string;
  /* Line 2. */
  livingQuarters: AmericanSamoaLivingQuarters[];
  /* Line 3b: who lived with the person and when; absent answers No on line 3a. */
  familyInAmericanSamoa?: string;
  /* Line 4b: each home outside American Samoa, rented or not, its occupants; absent answers No on line 4a. */
  homesOutsideAmericanSamoa?: string;
  /* Line 5: the employer's name and address, or "Self-employed". */
  employer: string;
  /* Line 6, one entry per absence. */
  absences?: AmericanSamoaAbsence[];
  /* Lines 7 to 14, the income that qualifies. Each is optional: absent means none. */
  wages?: AmericanSamoaWages;
  interest?: number;
  dividends?: number;
  business?: AmericanSamoaNetIncome;
  capitalGain?: AmericanSamoaNetIncome;
  rentalAndRoyalties?: AmericanSamoaNetIncome;
  farm?: AmericanSamoaNetIncome;
  otherIncome?: AmericanSamoaOtherIncome[];
}

export type AmericanSamoaExclusionOwner = "taxpayer" | "spouse";

export interface AmericanSamoaExclusionFact {
  key: string;
  owner: AmericanSamoaExclusionOwner;
  value: AmericanSamoaExclusionFactValue;
}

const AMERICAN_SAMOA_CATEGORY = "foreign";
const AMERICAN_SAMOA_PREFIX = "american_samoa_exclusion";
const OWNERS: readonly AmericanSamoaExclusionOwner[] = ["taxpayer", "spouse"];

export function makeAmericanSamoaExclusionFactKey(owner: AmericanSamoaExclusionOwner): string {
  return `${AMERICAN_SAMOA_PREFIX}.${owner}`;
}

export function isAmericanSamoaExclusionFactKey(key: string): boolean {
  return OWNERS.some((owner) => key === makeAmericanSamoaExclusionFactKey(owner));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/* The answers every Form 4563 needs: who qualifies and Part I's dates and text. */
function hasPartI(value: Record<string, unknown>): boolean {
  return (
    typeof value.bonaFideResidentAllYear === "boolean" &&
    typeof value.usCitizenOrResident === "boolean" &&
    typeof value.residenceBegan === "string" &&
    typeof value.employer === "string" &&
    Array.isArray(value.livingQuarters)
  );
}

/* Each person's fact, the taxpayer first. A fact without Part I's answers is listed apart. */
export function getAmericanSamoaExclusionFacts(facts: ReadonlyArray<FactRow>): {
  facts: AmericanSamoaExclusionFact[];
  incompleteKeys: string[];
} {
  const found: AmericanSamoaExclusionFact[] = [];
  const incompleteKeys: string[] = [];
  for (const owner of OWNERS) {
    const key = makeAmericanSamoaExclusionFactKey(owner);
    const row = facts.find((fact) => fact.category === AMERICAN_SAMOA_CATEGORY && fact.key === key);
    if (row === undefined) continue;
    if (!isRecord(row.value) || !hasPartI(row.value)) {
      incompleteKeys.push(key);
      continue;
    }
    found.push({ key, owner, value: row.value as unknown as AmericanSamoaExclusionFactValue });
  }
  return { facts: found, incompleteKeys };
}
