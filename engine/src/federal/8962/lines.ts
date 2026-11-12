/* MANUAL EDIT: Part II lines 9–29 and Parts IV–V, split from bindings.ts for the file-size cap. */

import type { BindingFn, FormAccessor } from "../../defineForm.js";
import {
  MARKETPLACE_MONTHS,
  rowShowsCoverage,
  type MarketplaceCoverageAmounts,
} from "../../facts/index.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import type { Form8962FilingInfo } from "./filingInfo.js";
import type { Form8962 } from "./types.js";

type Info = Form8962FilingInfo;
type Form = FormAccessor<Form8962>;
type Fn = (form: Form, info: Info) => unknown;
type Row = MarketplaceCoverageAmounts;
export type Bindings = Partial<{ [K in keyof Form8962]: BindingFn<Form8962, Info, K> }>;

/* Lines 12–23 are January through December. */
const FIRST_MONTH_LINE = 12;

/* Line 28, Table 5: by line 5, single and any other filing status; 400 or more leaves it blank. */
const TABLE_5 = [
  { below: 200, single: 375, other: 750 },
  { below: 300, single: 975, other: 1_950 },
  { below: 400, single: 1_625, other: 3_250 },
];

const PARTS_IV_V =
  "Line 9 Yes needs Part IV (allocating policy amounts) or Part V (the year-of-marriage calculation), which the engine does not model.";
const SLCSP_LOOKUP =
  "A blank or zero SLCSP premium on Form 1095-A column B means the taxpayer must look up the applicable SLCSP premium, which the engine does not do.";
const SEVERAL_STATEMENTS =
  "With more than one Form 1095-A covering the same month, column (b) depends on whether the policies are in the same state, which the engine does not ask.";
const UNPAID_PREMIUM =
  "A -0- enrollment premium on Form 1095-A needs to know whether the premium was paid by the return's due date, which the engine does not ask.";

/* An MFS filer without Exception 2 is not an applicable taxpayer; undefined while unanswered. */
export function isApplicableTaxpayer(info: Info): boolean | undefined {
  if (info.filingStatus === undefined) return undefined;
  if (info.filingStatus !== "married_filing_separately") return true;
  return info.ptcMfsException;
}

/* Lines 10–29 and Parts IV–V follow line 9: a Yes needs Part IV or V. */
const afterLine9 =
  (fn: Fn): Fn =>
  (form, info) => {
    const answer = info.ptcAllocatesPolicyOrMarriageCalc;
    if (answer === undefined) return undefined;
    return answer ? unsupported(PARTS_IV_V) : fn(form, info);
  };

function columnA(row: Row | undefined) {
  if (row?.enrollmentPremium === undefined) return undefined;
  if (row.enrollmentPremium === 0) return unsupported(UNPAID_PREMIUM);
  return roundDollars(row.enrollmentPremium);
}

function columnB(row: Row | undefined, statementCount: number | undefined) {
  if (!rowShowsCoverage(row)) return undefined;
  // An unpaid premium makes column (b) -0- (…::sec::lines-12-through-23-monthly-calculation::b04–b05).
  if (row?.enrollmentPremium === 0) return unsupported(UNPAID_PREMIUM);
  if ((statementCount ?? 0) > 1) return unsupported(SEVERAL_STATEMENTS);
  if (!row?.slcspPremium) return unsupported(SLCSP_LOOKUP);
  return roundDollars(row.slcspPremium);
}

/*
 * Columns (a)–(f) of line 11 or one of lines 12–23. Not an applicable
 * taxpayer: only (f). QSEHRA and not-lawfully-present entries are not modeled.
 * statementCount: the Forms 1095-A that cover the line's months (column (b)).
 */
function columnBindings(
  line: number,
  row: (form: Form, info: Info) => Row | undefined,
  statementCount: (info: Info) => number | undefined,
  contribution: keyof Form8962,
  blankAdvanceIsZero: boolean,
): Record<string, Fn> {
  const key = `0.line.${line}_col_`;
  const taking = (form: Form, info: Info) =>
    isApplicableTaxpayer(info) === true ? row(form, info) : undefined;
  return {
    [`${key}a`]: (form, info) => columnA(taking(form, info)),
    [`${key}b`]: (form, info) => columnB(taking(form, info), statementCount(info)),
    [`${key}c`]: (form, info) =>
      rowShowsCoverage(taking(form, info)) ? numberOrBlank(form[contribution]) : undefined,
    [`${key}d`]: (form) => {
      const slcsp = numberOrBlank(form[`${key}b`]);
      const contributed = numberOrBlank(form[`${key}c`]);
      return slcsp === undefined || contributed === undefined
        ? undefined
        : atLeast(0, slcsp - contributed);
    },
    [`${key}e`]: (form) => {
      const premiums = numberOrBlank(form[`${key}a`]);
      const maximum = numberOrBlank(form[`${key}d`]);
      return premiums === undefined || maximum === undefined
        ? undefined
        : Math.min(premiums, maximum);
    },
    [`${key}f`]: (form, info) => {
      const amounts = row(form, info);
      if (amounts === undefined) return undefined;
      return roundDollars(
        blankAdvanceIsZero ? sum(amounts.advancePayment) : amounts.advancePayment,
      );
    },
  };
}

/*
 * Line 11 when line 10 is Yes; lines 12–23 when it is No, January first.
 * Line 11's policies cover all 12 months, so its count is the year's.
 */
function calculationBindings(): Record<string, Fn> {
  const out = columnBindings(
    11,
    (form, info) =>
      form["0.line.10_use_annual_calc_yes"] === true ? info.marketplaceAnnualTotals : undefined,
    (info) => info.marketplaceStatementCount,
    "0.line.8a_annual_contribution_amount",
    true,
  );
  for (let index = 0; index < MARKETPLACE_MONTHS; index++) {
    const month = (form: Form, info: Info) =>
      form["0.line.10_use_annual_calc_no"] === true
        ? info.marketplaceMonthlyTotals?.[index]
        : undefined;
    const line = FIRST_MONTH_LINE + index;
    const count = (info: Info) => info.marketplaceMonthlyStatementCounts?.[index];
    Object.assign(
      out,
      columnBindings(line, month, count, "0.line.8b_monthly_contribution_amount", false),
    );
  }
  return out;
}

/* Line 24 (column e) or 25 (column f): line 11, or lines 12–23 with a blank month left out. */
function columnTotal(form: Form, info: Info, column: "e" | "f"): number | undefined {
  if (form["0.line.10_use_annual_calc_yes"] === true)
    return numberOrBlank(form[`0.line.11_col_${column}`]);
  if (form["0.line.10_use_annual_calc_no"] !== true) return undefined;
  const amounts: number[] = [];
  for (let index = 0; index < MARKETPLACE_MONTHS; index++) {
    const month = info.marketplaceMonthlyTotals?.[index];
    const filled = column === "e" ? rowShowsCoverage(month) : month?.advancePayment !== undefined;
    if (!filled) continue;
    const amount = numberOrBlank(form[`0.line.${FIRST_MONTH_LINE + index}_col_${column}`]);
    if (amount === undefined) return undefined;
    amounts.push(amount);
  }
  return sum(...amounts);
}

/* Line 27: the excess APTC; null when line 25 is not above line 24 (lines 27–29 skipped). */
function excessAdvance(form: Form): number | null | undefined {
  const line24 = form["0.line.24_total_ptc"];
  const line25 = form["0.line.25_advance_payment_ptc"];
  if (line24 === undefined || line25 === undefined) return undefined;
  return line25 > line24 ? line25 - line24 : null;
}

/* Line 28, Table 5; null when it stays blank. The self-employed health insurance case (Pub. 974) is not modeled. */
function repaymentLimit(form: Form, info: Info): number | null | undefined {
  const excess = excessAdvance(form);
  if (excess === null) return null;
  const line5 = form["0.line.5_household_income_percent_fpl"];
  if (excess === undefined || line5 === undefined || info.filingStatus === undefined)
    return undefined;
  const row = TABLE_5.find((limit) => line5 < limit.below);
  if (!row) return null;
  return info.filingStatus === "single" ? row.single : row.other;
}

function reconciliationBindings(): Record<string, Fn> {
  return {
    "0.line.24_total_ptc": (form, info) => {
      const applicable = isApplicableTaxpayer(info);
      if (applicable === undefined) return undefined;
      return applicable ? columnTotal(form, info, "e") : 0;
    },
    "0.line.25_advance_payment_ptc": (form, info) => columnTotal(form, info, "f"),
    "0.line.26_net_ptc": (form) => {
      const line24 = form["0.line.24_total_ptc"];
      const line25 = form["0.line.25_advance_payment_ptc"];
      if (line24 === undefined || line25 === undefined || line24 < line25) return undefined;
      return line24 - line25;
    },
    "0.line.27_excess_advance_ptc": (form) => excessAdvance(form) ?? undefined,
    "0.line.28_repayment_limitation": (form, info) => repaymentLimit(form, info) ?? undefined,
    "0.line.29_excess_advance_ptc_repayment": (form, info) => {
      const excess = excessAdvance(form);
      const limit = repaymentLimit(form, info);
      if (excess === null || excess === undefined || limit === undefined) return undefined;
      return limit === null ? excess : Math.min(excess, limit);
    },
  };
}

const gated = (bindings: Record<string, Fn>): Record<string, Fn> =>
  Object.fromEntries(Object.entries(bindings).map(([key, fn]) => [key, afterLine9(fn)]));

/* Lines 9–29. Line 10 does not model a missing or incorrect SLCSP premium (Pub. 974). */
export function partTwoBindings(): Bindings {
  const answer = (info: Info) => info.ptcAllocatesPolicyOrMarriageCalc;
  const sameEveryMonth = (info: Info) => info.marketplaceSameEveryMonth;
  return {
    "0.line.9_allocate_or_alt_calc_yes": (_, info) => answer(info),
    "0.line.9_allocate_or_alt_calc_no": (_, info) =>
      answer(info) === undefined ? undefined : !answer(info),
    ...gated({
      "0.line.10_use_annual_calc_yes": (_, info) => sameEveryMonth(info),
      "0.line.10_use_annual_calc_no": (_, info) =>
        sameEveryMonth(info) === undefined ? undefined : !sameEveryMonth(info),
      ...calculationBindings(),
      ...reconciliationBindings(),
    }),
  } as Bindings;
}

/* Parts IV and V: blank after a line 9 No; a Yes is not modeled. */
export function partsFourFiveBindings(): Bindings {
  const columns = (lines: number[], letters: string) =>
    lines.flatMap((line) => [...letters].map((letter) => `1.line.${line}_col_${letter}`));
  const keys = [
    ...columns([30, 31, 32, 33], "abcdefg"),
    "1.line.34_allocations_complete_yes",
    "1.line.34_allocations_complete_no",
    ...columns([35, 36], "abcd"),
  ];
  return gated(Object.fromEntries(keys.map((key) => [key, () => undefined]))) as Bindings;
}
