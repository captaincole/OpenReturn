/*
 * FTB 3801-CR: a California credit from a passive activity. "Form FTB 3801-CR
 * is filed by individuals ... with any of the following credits from passive
 * activities: Orphan drug credit carryover – 185, Low-income housing – 172,
 * Research – 183" (ca-3801cr-inst-2025::sec::c-who-must-file::b01). The credit
 * forms (FTB 3521, FTB 3523, FTB 3540) are not in the engine, so the taxpayer
 * states each credit as its credit form figures it, before the passive limit.
 *
 * One fact per activity, credit and column, as the federal Worksheets 1 to 4
 * list them ("Use California amounts when completing these worksheets",
 * ca-3801cr-inst-2025::sec::specific-line-instructions::b01):
 * - "current": column (a), the 2025 credit.
 * - "prior_year_unallowed": column (b), the credit last year's FTB 3801-CR did
 *   not allow (its line 5 less line 17, or its Worksheet 9 column (b)). The
 *   orphan drug credit is repealed, so only its carryover is stated.
 */

import type { BasisIncreaseElection, PassiveCreditActivity } from "./generalBusinessCredit.js";

type FactRow = { key: string; value: unknown; category: string };

/* The credit codes and names of Who Must File (ca-3801cr-inst-2025::sec::c-who-must-file::b01). */
export const CA_PASSIVE_CREDIT_NAMES = {
  "185": "Orphan Drug",
  "172": "Low-Income Housing",
  "183": "Research",
} as const;

export type CaPassiveCreditCode = keyof typeof CA_PASSIVE_CREDIT_NAMES;

export const CA_LOW_INCOME_HOUSING_CODE: CaPassiveCreditCode = "172";
export const CA_ORPHAN_DRUG_CODE: CaPassiveCreditCode = "185";

export const isCaPassiveCreditCode = (code: unknown): code is CaPassiveCreditCode =>
  typeof code === "string" && Object.keys(CA_PASSIVE_CREDIT_NAMES).includes(code);

export interface CaPassiveCreditFactValue {
  /* The credit code of Who Must File: "172", "183" or "185". */
  creditCode: CaPassiveCreditCode;
  /* Column (a) (the 2025 credit) or column (b) (last year's unallowed credit). */
  column: "current" | "prior_year_unallowed";
  /* Whole dollars, in California amounts, before the passive activity limit. */
  amount: number;
  /*
   * The passive activity the credit comes from. Its answers choose the
   * worksheet as on federal Form 8582-CR: a low-income housing credit goes on
   * Worksheet 2 (placed in service, or the pass-through interest acquired,
   * before 1990) or Worksheet 3; another credit from rental real estate with
   * active participation (in both years, for column (b)) on Worksheet 1;
   * everything else on Worksheet 4 (ca-3801cr-inst-2025::sec::line-1a-through-line-1c::b01
   * to ::line-4a-through-line-4c::b01). A publicly traded partnership's credit
   * is figured off the form (::credits-from-publicly-traded-partnerships-ptps::b01).
   */
  activity: PassiveCreditActivity;
  /*
   * Part IV, column (b) only: the taxpayer disposed of the entire interest in
   * the activity in a fully taxable transaction and elects to increase the
   * basis of the credit property (ca-3801cr-inst-2025::sec::part-iv-election-to-increase-basis-of-credit-property-2::b01).
   */
  basisIncreaseElection?: BasisIncreaseElection;
}

export interface CaPassiveCreditFact {
  key: string;
  value: CaPassiveCreditFactValue;
}

const CA_PASSIVE_CREDIT_CATEGORY = "other";
const CA_PASSIVE_CREDIT_PREFIX = "ca_passive_credit.";

export function makeCaPassiveCreditFactKey(slug: string): string {
  return `${CA_PASSIVE_CREDIT_PREFIX}${slug}`;
}

export function isCaPassiveCreditFactKey(key: string): boolean {
  const slug = key.slice(CA_PASSIVE_CREDIT_PREFIX.length);
  return key.startsWith(CA_PASSIVE_CREDIT_PREFIX) && slug !== "" && !slug.includes(".");
}

/* Every California passive credit fact, in the order recorded: the order of the worksheet rows. */
export function getCaPassiveCreditFacts(facts: ReadonlyArray<FactRow>): CaPassiveCreditFact[] {
  return facts
    .filter(
      (row) => row.category === CA_PASSIVE_CREDIT_CATEGORY && isCaPassiveCreditFactKey(row.key),
    )
    .map((row) => ({ key: row.key, value: row.value as CaPassiveCreditFactValue }));
}
