/*
 * Form 8915-F: qualified disaster retirement plan distributions and repayments.
 * One fact per Form 8915-F: one person and one year in which the disasters
 * began ("If married, file a separate form for each spouse", item B: "The
 * disasters ... must have all started in the same calendar year",
 * irs-8915f-inst-2025::sec::required-general-information::b01). The taxpayer
 * states which 1099-R amounts they treat as qualified disaster distributions
 * (Part I) or as qualified distributions for a main home (Part IV); no 1099-R
 * prints it. The amounts from earlier years come from the taxpayer's earlier
 * Forms 8915-F (last year's return is not read, #79).
 */

import type { IraOwner } from "./traditionalIra.js";

type FactRow = { key: string; value: unknown; category: string };

/* One FEMA major disaster (item C and the Part I and Part IV tables). Dates are YYYY-MM-DD. */
export interface QualifiedDisaster {
  /* The FEMA DR number, "DR-4747-KS" (required-general-information::b02). */
  femaNumber: string;
  declarationDate: string;
  /* The first day of the incident period. */
  beginningDate: string;
  /* The last day of the incident period (the Part IV table); absent while FEMA shows it continuing. */
  endingDate?: string;
  /*
   * Part I requirements 2 and 3: the main home was in the disaster area during
   * the disaster period, and the taxpayer had an economic loss because of the
   * disaster (qualified-disaster-distribution-requirements::b02–b03). Absent or
   * false: the disaster takes no qualified disaster distributions.
   */
  mainHomeInAreaWithLoss?: boolean;
  /* Listed in item C of a Form 8915-F for an earlier year (lines 1a and 1d, Worksheet 1B). */
  onEarlierForm8915F?: boolean;
  /*
   * Qualified disaster distributions made in earlier years for this disaster
   * (line 1b adds them; Worksheet 1B column (X), line-1b::b02). Absent: none.
   */
  earlierQualifiedDisasterDistributions?: number;
}

/* A 1099-R amount the taxpayer treats as a qualified disaster distribution (Part I). */
export interface DisasterDistributionPart {
  /* The 1099-R fact's key (makeRetirementDistributionFactKey). */
  distributionKey: string;
  /* The part of box 1; absent means all of box 1. */
  amount?: number;
  /* The day the distribution was made, YYYY-MM-DD ("Date(s) of distribution(s) made this year"). */
  date: string;
}

/*
 * A 1099-R amount received for the purchase or construction of a main home in
 * the disaster area that was not bought or built because of the disaster
 * (Part IV; qualified-distribution-requirements::b02–b03): a hardship
 * distribution from a 401(k) plan or a tax-sheltered annuity, or a qualified
 * first-time homebuyer distribution from an IRA.
 */
export interface HomePurchaseDistribution extends DisasterDistributionPart {
  /*
   * Repaid to an eligible plan within the disaster's qualified distribution
   * repayment period, and before the return is filed (line 31,
   * irs-8915f-inst-2025::sec::line-31::b01). Not repayments of nontaxable
   * amounts. Absent: none.
   */
  repaid?: number;
}

/* The lines of an earlier year's Form 8915-F for the same disasters (Worksheets 2 to 5). */
export interface EarlierForm8915F {
  line11?: number;
  /* The box on line 11 (the election not to spread over 3 years). */
  line11Checked?: boolean;
  line13?: number;
  line14?: number;
  line22?: number;
  line22Checked?: boolean;
  line24?: number;
  line25?: number;
}

/* Amounts kept apart for the other-than-IRA plans (Part II) and the IRAs (Part III). */
export interface PlanAndIraAmounts {
  plan?: number;
  ira?: number;
}

/* The years a Form 8915-F for 2025 can check in item B (QUESTIONS.md). */
export const DISASTER_YEARS_FOR_2025 = [2021, 2022, 2023, 2024, 2025, 2026] as const;

export interface DisasterRetirementFactValue {
  /* Whose form it is. Absent means the taxpayer. */
  owner?: IraOwner;
  /* Item B: the calendar year in which the disasters began. */
  disasterYear: number;
  /* Item C, in order. */
  disasters: QualifiedDisaster[];
  /* Part I. */
  qualifiedDisasterDistributions?: DisasterDistributionPart[];
  /* Part IV. */
  homePurchaseDistributions?: HomePurchaseDistribution[];
  /* The boxes on lines 11 and 22: include the whole taxable amount this year. Absent: spread over 3 years. */
  electNotToSpread?: boolean;
  /* Last year's Form 8915-F for the same item B year. */
  lastYearForm?: EarlierForm8915F;
  /* The Form 8915-F of two years ago for the same item B year. */
  formTwoYearsAgo?: EarlierForm8915F;
  /* Worksheet 3 and 5 line 3b: excess repayment already carried back to an earlier year. */
  excessRepaymentCarriedBack?: PlanAndIraAmounts;
  /*
   * Worksheet 3 and 5 line 4: repayments made for this year's form before the
   * return is filed, not later than its due date with extensions, not of
   * nontaxable amounts (line-14::b04, worksheet-5::b02).
   */
  repaymentsThisYear?: PlanAndIraAmounts;
}

export interface DisasterRetirementFact {
  key: string;
  value: DisasterRetirementFactValue;
}

const DISASTER_CATEGORY = "retirement";
const DISASTER_PREFIX = "retirement.qualified_disaster.";

/* One key per form: the slug names the person and the year, "taxpayer-2024". */
export function makeDisasterRetirementFactKey(formSlug: string): string {
  return `${DISASTER_PREFIX}${formSlug}`;
}

export function isDisasterRetirementFactKey(key: string): boolean {
  if (!key.startsWith(DISASTER_PREFIX)) return false;
  const slug = key.slice(DISASTER_PREFIX.length);
  return slug !== "" && !slug.includes(".");
}

/* Every Form 8915-F fact, in the order recorded. */
export function getDisasterRetirementFacts(
  facts: ReadonlyArray<FactRow>,
): DisasterRetirementFact[] {
  return facts
    .filter((row) => row.category === DISASTER_CATEGORY && isDisasterRetirementFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as DisasterRetirementFactValue }));
}
