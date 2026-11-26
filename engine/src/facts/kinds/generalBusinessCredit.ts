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
  /* The pass-through entity's EIN, for a credit allocated by one (column (c)). */
  passThroughEin?: string;
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
  /* Earned in a passive activity (column (d)); otherwise column (f). */
  passive: boolean;
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

/* Every carryover fact, in the order recorded: the order of the Part VI rows. */
export function getCreditCarryoverFacts(facts: ReadonlyArray<FactRow>): CreditCarryoverFact[] {
  return facts
    .filter((row) => row.category === CREDIT_CATEGORY && isCreditCarryoverFactKey(row.key))
    .map((row) => ({ key: row.key, value: row.value as CreditCarryoverFactValue }));
}
