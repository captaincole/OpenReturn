/*
 * Form 2555: the foreign earned income exclusion, the housing exclusion and the
 * housing deduction (irs-2555-inst-2025::sec::purpose-of-form::b01). One fact
 * per person who claims them: "figure the amount of the exclusion separately
 * for each of you. You each must complete Part VII of your separate Forms
 * 2555" (part-vii-taxpayers-claiming-the::b01). The taxpayer states each
 * answer; no document holds them.
 *
 * Part IV measures the foreign earned income that the return already reports
 * elsewhere (a W-2, Schedule C, Schedule E): "include wages from Form 1040 or
 * 1040-SR, line 1" (part-iv-all-taxpayers::b01). This fact does not add income
 * to Form 1040.
 *
 * Each amount is in U.S. dollars, or in a foreign currency as
 * { amount, currency }. The engine converts a foreign amount at the IRS yearly
 * average of 2025 (federal/2555/person.ts): the fact holds no exchange rate.
 * Dates are "MM/DD/YYYY", as the foreign currency facts write them.
 */

type FactRow = { key: string; value: unknown; category: string };

/* An amount in dollars, or in the currency it was paid in (ISO 4217: "EUR"). */
export type ForeignAmount = number | { amount: number; currency: string };

/* Line 5: what the employer is; the form says "check any that apply". */
export type Form2555EmployerType =
  "foreign_entity" | "us_company" | "self" | "foreign_affiliate" | "other";

/* Line 11: the kind of living quarters in the foreign country. */
export type Form2555LivingQuarters =
  "purchased_house" | "rented_house" | "rented_room" | "employer_quarters";

/* An amount with the words the form prints next to it (lines 20b, 21d, 22f, 23). */
export interface DescribedAmount {
  description: string;
  amount: ForeignAmount;
}

/* Line 14: one stay in the United States or its territories during the tax year. */
export interface UsVisit {
  arrived: string;
  left: string;
  /* Column (c). */
  businessDays: number;
  /* Column (d): income earned in the U.S. on business. Not in Part IV. */
  businessIncome?: ForeignAmount;
}

/* Line 18: one stay in a country during the 12-month period of line 16. */
export interface PresenceStay {
  /* Column (a): "United States" for a stay in the U.S. */
  country: string;
  arrived: string;
  left: string;
  /* Column (d): full days present in the country, each a 24-hour day from midnight. */
  fullDays: number;
  /* Column (e). */
  usBusinessDays?: number;
  /* Column (f): income earned in the U.S. on business. Not in Part IV. */
  usBusinessIncome?: ForeignAmount;
}

/* Part II: the bona fide residence test. */
export interface BonaFideResidence {
  /* Line 10. */
  began: string;
  /* Line 10; absent prints "Continues" (irs-2555-inst-2025::sec::line-10::b01). */
  ended?: string;
  /* Line 11. */
  livingQuarters: Form2555LivingQuarters[];
  /* Line 12b: who lived with the taxpayer and when; absent answers No on line 12a. */
  familyAbroad?: string;
  /* Line 13a: a statement of nonresidence given to the foreign country. */
  nonresidentStatement: boolean;
  /* Line 13b: the country requires income tax from the taxpayer. */
  foreignIncomeTaxRequired: boolean;
  /* Line 14, one entry per stay. */
  usVisits?: UsVisit[];
  /* Line 15a. */
  contractTerms: string;
  /* Line 15b. */
  visaType: string;
  /* Line 15c. */
  visaLimitedStay: boolean;
  /* Line 15e: the U.S. home's address, rented or not, its occupants; absent answers No on line 15d. */
  usHome?: string;
}

/* Part III: the physical presence test. */
export interface PhysicalPresence {
  /* Line 16: the 12-month period. */
  from: string;
  through: string;
  /* Line 17. */
  principalCountry: string;
  /*
   * Line 18: every stay of the 12-month period, each country (the U.S. too).
   * Absent or empty: present in a foreign country for the whole period.
   */
  stays?: PresenceStay[];
}

/* Line 20a or 20b: income from a business or a partnership share, for personal services. */
export interface SelfEmploymentIncome {
  /* Line 20b only: the partnership's name and address and the type of income. */
  description?: string;
  /* The gross income of the business, or the partner's share of the partnership's gross income. */
  grossIncome: ForeignAmount;
  /* The business's expenses, or the partner's share of them: deductions definitely related (line 44). */
  expenses?: ForeignAmount;
  /*
   * Capital is a material income-producing factor. Then only a reasonable
   * allowance for services, at most 30% of the net profits, is earned income
   * (irs-2555-inst-2025::sec::line-20::b01).
   */
  capitalMaterial: boolean;
}

export interface ForeignEarnedIncomeFactValue {
  /* Line 1. */
  foreignAddress: string;
  /* Line 2. */
  occupation: string;
  /* Lines 3 to 5. */
  employer?: {
    name: string;
    usAddress?: string;
    foreignAddress?: string;
    types: Form2555EmployerType[];
    /* Line 5e's words, with "other". */
    otherType?: string;
  };
  /* Line 6a: the last year Form 2555 or 2555-EZ was filed; absent checks line 6b. */
  lastYearFiled?: number;
  /* Line 6d: the exclusion revoked and the year; absent answers No on line 6c. */
  revocation?: string;
  /* Line 7. */
  citizenship: string;
  /* Line 8b: a second foreign household kept for the family because of adverse conditions. */
  secondHousehold?: { cityCountry: string; days: number };
  /* Line 9: each tax home and the date it was established, the first one first. */
  taxHomes: Array<{ location: string; established: string }>;
  /* Part II or Part III, not both (irs-2555-inst-2025::sec::line-9::b01). */
  bonaFideResidence?: BonaFideResidence;
  physicalPresence?: PhysicalPresence;
  /* Line 19. */
  wages?: ForeignAmount;
  /* Line 20a. */
  business?: SelfEmploymentIncome;
  /* Line 20b. */
  partnership?: SelfEmploymentIncome;
  /* Line 21: noncash income at market value. */
  noncash?: {
    lodging?: ForeignAmount;
    meals?: ForeignAmount;
    car?: ForeignAmount;
    other?: DescribedAmount;
  };
  /* Line 22: allowances, reimbursements or expenses paid on the taxpayer's behalf. */
  allowances?: {
    costOfLiving?: ForeignAmount;
    family?: ForeignAmount;
    education?: ForeignAmount;
    homeLeave?: ForeignAmount;
    quarters?: ForeignAmount;
    other?: DescribedAmount;
  };
  /* Line 23. */
  otherIncome?: DescribedAmount;
  /* Line 25: meals and lodging included in Part IV that section 119 excludes. */
  excludableMealsAndLodging?: ForeignAmount;
  /* Part VI: present when the taxpayer claims the housing exclusion or deduction. */
  housing?: {
    /* Line 28: the qualified housing expenses of the qualifying period. */
    expenses: ForeignAmount;
    /* Line 29a: the location, only when Notice 2025-16 lists it. */
    listedLocation?: string;
  };
  /* Part VII. Absent: the taxpayer claims the foreign earned income exclusion. */
  claimsIncomeExclusion?: boolean;
  /*
   * Line 44: deductions in figuring AGI that are definitely related to the
   * foreign earned income, other than the business and partnership expenses
   * and the deductible part of self-employment tax. In dollars. Absent: none.
   */
  otherRelatedDeductions?: number;
  /*
   * Line 44: every self-employment amount on Schedule SE of this return comes
   * from the business and partnership on this form, so the whole deductible
   * part of self-employment tax is definitely related to them. Asked only when
   * line 20a or 20b has an amount.
   */
  allSelfEmploymentOnForm?: boolean;
  /* Line 49: last year's Form 2555 lines 46 and 48, in dollars. Absent: no 2024 Part IX. */
  priorYearHousing?: { line46: number; line48: number };
  /*
   * Lines 31 and 38: the qualifying period, when it is not the period of line
   * 10 or line 16 that starts no earlier than the first tax home.
   */
  qualifyingPeriod?: { from: string; through: string };
}

export type ForeignEarnedIncomeOwner = "taxpayer" | "spouse";

export interface ForeignEarnedIncomeFact {
  key: string;
  owner: ForeignEarnedIncomeOwner;
  value: ForeignEarnedIncomeFactValue;
}

const FOREIGN_INCOME_CATEGORY = "foreign";
const FOREIGN_INCOME_PREFIX = "foreign_earned_income";
const OWNERS: readonly ForeignEarnedIncomeOwner[] = ["taxpayer", "spouse"];

export function makeForeignEarnedIncomeFactKey(owner: ForeignEarnedIncomeOwner): string {
  return `${FOREIGN_INCOME_PREFIX}.${owner}`;
}

export function isForeignEarnedIncomeFactKey(key: string): boolean {
  return OWNERS.some((owner) => key === makeForeignEarnedIncomeFactKey(owner));
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/* The answers every Form 2555 needs: Part I's text and the tax homes. */
function hasPartI(value: Record<string, unknown>): boolean {
  return (
    typeof value.foreignAddress === "string" &&
    typeof value.occupation === "string" &&
    typeof value.citizenship === "string" &&
    Array.isArray(value.taxHomes)
  );
}

/* Each person's fact, the taxpayer first; a fact without Part I's answers is left out. */
export function getForeignEarnedIncomeFacts(
  facts: ReadonlyArray<FactRow>,
): ForeignEarnedIncomeFact[] {
  return OWNERS.flatMap((owner) => {
    const key = makeForeignEarnedIncomeFactKey(owner);
    const row = facts.find((fact) => fact.category === FOREIGN_INCOME_CATEGORY && fact.key === key);
    if (row === undefined || !isRecord(row.value) || !hasPartI(row.value)) return [];
    return [{ key, owner, value: row.value as unknown as ForeignEarnedIncomeFactValue }];
  });
}
