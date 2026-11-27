/*
 * Form 3800: general business credits the engine does not figure from a source
 * credit form of its own. "You must file Form 3800 and the credit source form(s)
 * to claim any of the general business credits" (irs-3800-inst-2025::sec::who-must-file::b01);
 * the engine has no rules for most source forms (Form 3468, 6765, 8826 and so
 * on), so the taxpayer states each credit the source form figures.
 *
 * - A current-year credit is one fact per source (a facility, a business, a
 *   K-1 the taxpayer states by hand): Part III and, for a line with more than
 *   one source, Part V.
 * - A carryover is one fact per source and originating year, from last year's
 *   return (its Form 3800 Part IV column (i), "Carryforward to 2026" on the
 *   2025 form): Part IV and, for a line with more than one, Part VI
 *   (irs-3800-inst-2025::sec::part-iv-2::b01: "The information on Parts IV and
 *   VI comes from your tax returns and schedules for prior years").
 *
 * A credit on a partnership or S corporation K-1 is not stated here: the K-1
 * fact holds it (passThrough, the business_credit items). A research credit
 * from a K-1 needs one answer of its own (GENERAL_BUSINESS_CREDIT_KEYS.k1Research).
 */

import { roundDollars, sum } from "../../money.js";

type FactRow = { key: string; value: unknown; category: string };

/* A section 6418 transfer of part of the credit (Part III column (f), Part V columns (d)(2), (d)(3), (f)(1), (f)(2)). */
export interface CreditTransfer {
  /* "sold": the taxpayer transferred it out; "purchased": it was transferred to the taxpayer. */
  direction: "sold" | "purchased";
  /* A positive amount; the form prints a sale as a negative amount in column (f). */
  amount: number;
  /* The IRS transfer registration number (Part III column (b)). */
  registrationNumber: string;
  /* The transferor's EIN, for a purchased credit (Part V column (c)(2)). */
  transferorEin?: string;
}

/*
 * Form 8582-CR: the passive activity a passive credit comes from. Its
 * worksheet (1 to 4) follows from these answers and the credit's line
 * (irs-8582cr-inst-2025::sec::reporting-credits-from-the-activities::b02, ::b03):
 * a rehabilitation credit (line 4k) from rental real estate goes on Worksheet 2;
 * a low-income housing credit (line 4d, Part IV line 2b) on Worksheet 2 before
 * 1990, else 3; any other credit from rental real estate with active
 * participation on Worksheet 1; everything else on Worksheet 4.
 */
export interface PassiveCreditActivity {
  /* The activity's name, as the worksheets list it ("Name of Activity"). */
  name: string;
  /* A rental real estate activity; false for a trade or business or another rental. */
  rentalRealEstate: boolean;
  /*
   * Rental real estate only: the taxpayer actively participated this year. For
   * a carryover, in both the year the credit arose and this year
   * (irs-8582cr-inst-2025::sec::lines-1a-through-1c::b02). Asked for a credit
   * other than the rehabilitation and low-income housing credits.
   */
  activelyParticipated?: boolean;
  /*
   * Low-income housing credit only: the property was placed in service before
   * 1990, or is held through a pass-through entity interest acquired before 1990
   * (irs-8582cr-inst-2025::sec::lines-2a-through-2c::b01).
   */
  before1990?: boolean;
  /* Held through a publicly traded partnership: figured apart from the form (credits-from-ptps::b02). */
  publiclyTradedPartnership?: boolean;
}

/*
 * Form 8582-CR Part VI: the taxpayer disposed of the entire interest in the
 * activity in a fully taxable transaction and elects to increase the basis of
 * the credit property by the unallowed credit that reduced it
 * (irs-8582cr-inst-2025::sec::line-38::b01). "The amount of the unallowed
 * credit that may be applied against tax is reduced by the amount of the basis
 * adjustment."
 */
export interface BasisIncreaseElection {
  /* Line 40. */
  propertyDescription: string;
  /* Line 41: the unallowed credit that reduced the basis, the basis adjustment. */
  amount: number;
}

export interface GeneralBusinessCreditFactValue {
  /*
   * The source credit form as Part III names it: "8826", "3468 Part II",
   * "6765", "8864 SAF". It must be the form of the line below.
   */
  sourceForm: string;
  /* The Part III line: "1e", "3", "4b". */
  line: string;
  /* The credit the source form figures, in dollars, before the passive activity limit. */
  amount: number;
  /*
   * From an activity that is passive for the taxpayer (section 469): column
   * (d), which needs Form 8582-CR. Otherwise column (e).
   */
  passive: boolean;
  /* A passive credit's activity, for Form 8582-CR; asked when passive is true. */
  passiveActivity?: PassiveCreditActivity;
  /* The pass-through entity's EIN, for a credit allocated by one (column (c)). */
  passThroughEin?: string;
  /*
   * A Form 8932 or Form 8994 credit of the taxpayer's own employees only: the
   * fact key of the Schedule C business that paid the wages. Its line 26 goes
   * down by the credit (statedWageCreditsByBusiness).
   */
  businessKey?: string;
  /*
   * Research credit only (lines 1c and 4i): the taxable income attributable to
   * the sole proprietorship or the interest that generates the credit
   * (irs-3800-inst-2025::sec::lines-1c-and-4i::b01).
   */
  attributableTaxableIncome?: number;
  transfer?: CreditTransfer;
  /* A section 6417 or 48D elective payment election (column (h)). */
  electivePayment?: { amount: number; registrationNumber: string };
}

export interface GeneralBusinessCreditFact {
  key: string;
  value: GeneralBusinessCreditFactValue;
}

export interface CreditCarryoverFactValue {
  /* The source credit form as Part IV names it: "8826", "5884-A", "8586 pre-2008". */
  sourceForm: string;
  /* The Part IV line: "1e", "2a", "4y". */
  line: string;
  /* The tax year the credit arose in; 2026 for a carryback to an amended 2025 return. */
  originYear: number;
  /* The unused credit carried to 2025, in dollars. */
  amount: number;
  /*
   * Earned in a passive activity (column (d)); otherwise column (f). A passive
   * carryover is a prior year unallowed credit of Form 8582-CR: last year's
   * Worksheet 9 column (b), or its line 5 less line 37
   * (irs-8582cr-inst-2025::sec::prior-year-unallowed-credits::b01).
   */
  passive: boolean;
  /* A passive carryover's activity, for Form 8582-CR; asked when passive is true. */
  passiveActivity?: PassiveCreditActivity;
  /* Form 8582-CR Part VI, a passive carryover only. */
  basisIncreaseElection?: BasisIncreaseElection;
  passThroughEin?: string;
  /* The amount was changed or revised from the one reported on the original return (Part I line 4, Part II line 34 boxes). */
  changedFromOriginal?: boolean;
  /* Column (h): recaptured (Form 4255 or elsewhere) or adjusted on audit; absent means none. */
  recapturedOrAdjusted?: number;
}

export interface CreditCarryoverFact {
  key: string;
  value: CreditCarryoverFactValue;
}

/* The answers a K-1 research credit needs (Part III line 1c or 4i). */
export interface K1ResearchCreditAnswer {
  /* Both the entity and the taxpayer are eligible small businesses: line 4i, else line 1c. */
  eligibleSmallBusiness: boolean;
  /* The taxable income attributable to the interest in the entity. */
  attributableTaxableIncome: number;
}

const CREDIT_CATEGORY = "other";
const CURRENT_PREFIX = "general_business_credit.current.";
const CARRYOVER_PREFIX = "general_business_credit.carryover.";
const K1_RESEARCH_PREFIX = "general_business_credit.k1_research.";

export const GENERAL_BUSINESS_CREDIT_KEYS = {
  /* The research credit answers of one K-1, by the K-1 fact key. */
  k1Research: (k1Key: string) => `${K1_RESEARCH_PREFIX}${k1Key}`,
} as const;

export function makeGeneralBusinessCreditFactKey(slug: string): string {
  return `${CURRENT_PREFIX}${slug}`;
}

export function makeCreditCarryoverFactKey(slug: string): string {
  return `${CARRYOVER_PREFIX}${slug}`;
}

const hasSlug = (key: string, prefix: string) =>
  key.startsWith(prefix) && key.length > prefix.length && !key.slice(prefix.length).includes(".");

export const isGeneralBusinessCreditFactKey = (key: string) => hasSlug(key, CURRENT_PREFIX);
export const isCreditCarryoverFactKey = (key: string) => hasSlug(key, CARRYOVER_PREFIX);

/* Every current-year credit fact, in the order recorded: the order of the Part V rows. */
export function getGeneralBusinessCreditFacts(
  facts: ReadonlyArray<FactRow>,
): GeneralBusinessCreditFact[] {
  return facts
    .filter((row) => row.category === CREDIT_CATEGORY && isGeneralBusinessCreditFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as GeneralBusinessCreditFactValue }));
}

/*
 * The stated credits that lower Schedule C wages: "Enter the total salaries
 * and wages for the tax year reduced by the amount of the following credit(s)
 * ... Credit for Employer Differential Wage Payments (Form 8932). Employer
 * Credit for Paid Family and Medical Leave (Form 8994). Do not reduce your
 * deduction for any portion of a credit that was passed through to you from a
 * pass-through entity" (irs-1040sc-inst-2025::sec::line-26::b01).
 */
export const STATED_WAGE_CREDIT_FORMS: ReadonlyArray<string> = ["8932", "8994"];

/* A stated Form 8932 or 8994 credit of the taxpayer's own employees (no pass-through EIN). */
export const isOwnStatedWageCredit = (value: GeneralBusinessCreditFactValue): boolean =>
  STATED_WAGE_CREDIT_FORMS.includes(value.sourceForm) && value.passThroughEin === undefined;

/*
 * Each Schedule C business's own stated wage credits, rounded as Form 3800
 * prints them, by the business fact key. A credit that names no business is
 * a gap on its Form 3800 line (3800/sources.ts), not a reduction here.
 */
export function statedWageCreditsByBusiness(facts: ReadonlyArray<FactRow>): Map<string, number> {
  const out = new Map<string, number>();
  for (const { value } of getGeneralBusinessCreditFacts(facts)) {
    if (!isOwnStatedWageCredit(value) || value.businessKey === undefined) continue;
    out.set(value.businessKey, sum(out.get(value.businessKey), roundDollars(value.amount)));
  }
  return out;
}

/* Every carryover fact, in the order recorded: the order of the Part VI rows. */
export function getCreditCarryoverFacts(facts: ReadonlyArray<FactRow>): CreditCarryoverFact[] {
  return facts
    .filter((row) => row.category === CREDIT_CATEGORY && isCreditCarryoverFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CreditCarryoverFactValue }));
}
