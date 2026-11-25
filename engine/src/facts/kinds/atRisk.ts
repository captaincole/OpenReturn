/*
 * Form 6198: the owner's amounts at risk in one activity that has amounts not
 * at risk (irs-6198-inst-2025::sec::who-must-file::b01). The taxpayer states
 * them; no document prints them. One set of answers per activity:
 * - a Schedule C business keeps them on its business fact (business.ts, atRisk);
 * - a Schedule K-1 activity has its own fact, key at_risk.<K-1 fact key>,
 *   category other (makeAtRiskFactKey).
 * Every amount is a positive number; a field left out means none, except the
 * starting amounts each method needs (Part II line 6, Part III line 11 or the
 * prior year's line 19b), which the form waits on.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * Part II, the simplified computation: it needs the adjusted basis (irs-6198-inst-2025::sec::part-ii-simplified::b01).
 * Where a person finds each answer: a partner's basis on last year's Partner's
 * Basis Worksheet line 18, a shareholder's on last year's Form 7203; the
 * K-1's item L (capital contributed, withdrawals and distributions) and box 19
 * (box 16 code D for an S corporation); item K (the share of nonrecourse,
 * qualified nonrecourse and recourse liabilities); the loan papers for who is
 * personally liable.
 */
export interface AtRiskSimplified {
  /* Line 6: what was your adjusted basis in the activity, or in your interest, on the first day of the year? (::line-6::b01). */
  adjustedBasisAtStart: number;
  /*
   * Line 7: this year's cash and property put in, and loans for the activity
   * you are personally liable for; not this year's income (::line-7::b01 to ::b03).
   */
  increases?: number;
  /*
   * Line 9: this year's withdrawals and distributions, and the nonrecourse or
   * protected amounts that are in line 6; not this year's losses (::line-9::b01, ::b02).
   */
  decreases?: number;
}

/*
 * Where Part III starts (irs-6198-inst-2025::sec::part-iii-detailed::b01):
 * - prior_year_form: Part III was completed for the activity last year; line 15
 *   is last year's line 19b (::line-15::b01);
 * - effective_date: the activity began before its effective date; lines 11 to
 *   14 give the amount at risk then (::effective-dates::b01);
 * - began_after_effective_date: the activity began on or after it, and Part III
 *   was not completed last year; line 15 is 0.
 */
export type AtRiskDetailedStart =
  "prior_year_form" | "effective_date" | "began_after_effective_date";

/* Part III, the detailed computation. */
export interface AtRiskDetailed {
  start: AtRiskDetailedStart;
  /* Line 15 when start is prior_year_form: the amount on last year's Form 6198 line 19b, never line 10b. */
  priorYearAmountAtRisk?: number;
  /* Line 11 when start is effective_date: the investment at the effective date (the Line 11 Worksheet). */
  investmentAtEffectiveDate?: number;
  /* Line 12: increases at the effective date (::line-12::b01, the Line 12 Worksheet). */
  increasesAtEffectiveDate?: number;
  /* Line 14: decreases at the effective date (::line-14::b01, ::b02). */
  decreasesAtEffectiveDate?: number;
  /*
   * Line 16: cash and property put in, loans you are personally liable for,
   * and qualified nonrecourse financing, since the effective date or since
   * the end of last year; not this year's income (::line-16::b01 to ::b06).
   */
  increasesSince?: number;
  /*
   * Line 18: withdrawals and distributions, loans that became nonrecourse or
   * protected, since then; with last year's form, last year's line 21 loss too
   * (::line-18::b01 to ::line-14-2::b02; federal/6198/QUESTIONS.md item 15).
   *
   * DECISION (2026-11-24): last year's deducted loss lowers this year's start.
   * - "Your prior tax year line 21 deductible loss reduces your at-risk
   *   investment as of the beginning of your current tax year"
   *   (irs-6198-inst-2025::sec::line-14-2::b01).
   * - Line 18 takes decreases "that occurred since the end of your prior tax
   *   year" (irs-6198-inst-2025::sec::line-18::b01).
   * The engine follows the first: this amount includes last year's line 21.
   * Last year's line 19b is figured before line 21, so without this the same
   * dollars at risk would support a loss twice.
   */
  decreasesSince?: number;
}

/*
 * Lines 2a to 2c: gains (a loss negative) from selling assets used in the
 * activity, or the interest in it, that the owner reports on another form
 * (irs-6198-inst-2025::sec::lines-2a-2b-and-2c::b01). For a K-1, only amounts
 * the K-1 does not print.
 */
export interface AtRiskDispositions {
  /* Line 2a: reported on Schedule D. */
  scheduleD?: number;
  /* Line 2b: reported on Form 4797. */
  form4797?: number;
  /* Line 2c: reported on another form or schedule, named on the dotted line (::b02). */
  otherForm?: { form: string; amount: number };
}

export interface AtRiskAmounts {
  /* The header's description of the activity; the K-1's name and EIN follow it (irs-6198-inst-2025::sec::specific-instructions::b01). */
  description?: string;
  simplified?: AtRiskSimplified;
  detailed?: AtRiskDetailed;
  dispositions?: AtRiskDispositions;
}

const AT_RISK_CATEGORY = "other";
const AT_RISK_PREFIX = "at_risk.";

/* The fact for a K-1 activity: at_risk.<K-1 fact key>, e.g. at_risk.k1.partnership.ridge. */
export function makeAtRiskFactKey(activityFactKey: string): string {
  return `${AT_RISK_PREFIX}${activityFactKey}`;
}

export function isAtRiskFactKey(key: string): boolean {
  return key.startsWith(AT_RISK_PREFIX) && key.length > AT_RISK_PREFIX.length;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isAmount = (value: unknown): boolean =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isOptionalAmount = (value: unknown): boolean => value === undefined || isAmount(value);

const isOptionalSigned = (value: unknown): boolean =>
  value === undefined || (typeof value === "number" && Number.isFinite(value));

const STARTS: ReadonlyArray<unknown> = [
  "prior_year_form",
  "effective_date",
  "began_after_effective_date",
];

const isSimplified = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isAmount(value.adjustedBasisAtStart) &&
    isOptionalAmount(value.increases) &&
    isOptionalAmount(value.decreases));

const DETAILED_AMOUNTS = [
  "priorYearAmountAtRisk",
  "investmentAtEffectiveDate",
  "increasesAtEffectiveDate",
  "decreasesAtEffectiveDate",
  "increasesSince",
  "decreasesSince",
] as const;

const isDetailed = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    STARTS.includes(value.start) &&
    DETAILED_AMOUNTS.every((field) => isOptionalAmount(value[field])));

const isOtherForm = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) && typeof value.form === "string" && isOptionalSigned(value.amount));

const isDispositions = (value: unknown): boolean =>
  value === undefined ||
  (isRecord(value) &&
    isOptionalSigned(value.scheduleD) &&
    isOptionalSigned(value.form4797) &&
    isOtherForm(value.otherForm));

/* The answers have their types; undefined is a valid "not given". */
export function isAtRiskAmounts(value: unknown): value is AtRiskAmounts | undefined {
  if (value === undefined) return true;
  return (
    isRecord(value) &&
    (value.description === undefined || typeof value.description === "string") &&
    isSimplified(value.simplified) &&
    isDetailed(value.detailed) &&
    isDispositions(value.dispositions)
  );
}

/* Each K-1 activity's at-risk fact whose fields have their types, by key; a malformed one is listed. */
export function readAtRiskFacts(facts: ReadonlyArray<FactRow>): {
  amounts: Map<string, AtRiskAmounts>;
  malformedKeys: string[];
} {
  const rows = facts.filter((row) => row.category === AT_RISK_CATEGORY && isAtRiskFactKey(row.key));
  const valid = (row: FactRow) => row.value !== undefined && isAtRiskAmounts(row.value);
  return {
    amounts: new Map(rows.filter(valid).map((row) => [row.key, row.value as AtRiskAmounts])),
    malformedKeys: rows.filter((row) => !valid(row)).map((row) => row.key),
  };
}
