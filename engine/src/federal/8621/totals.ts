/*
 * Every fund's Form 8621, which ones file, and the amounts they send to other
 * forms added across the funds. A line of another form that takes an amount
 * reads it through withForm8621.
 */

import { getPficFundFacts } from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { form8621Fund, section1291Amount, type Form8621Fund } from "./fund.js";
import type { FundResults } from "./results.js";

/*
 * "Exception if aggregate value of shareholder's PFIC stock is $25,000 or
 * less" ($50,000 on a joint return), for a section 1291 fund with no excess
 * distribution or gain (irs-8621-inst-2025::sec::exceptions-to-filing-part-i::b02–b03).
 */
export const PART_I_EXCEPTION_LIMIT = 25_000;
export const PART_I_EXCEPTION_LIMIT_JOINT = 50_000;

export interface PayerRow {
  payerName: string;
  amount: number;
}

export interface Form8621Totals {
  /* Every fund fact's form, in the order recorded. */
  funds: Form8621Fund[];
  /* The funds whose form files: the printed copies. */
  filed: Form8621Fund[];
  /* Why the amounts below cannot be figured (a fund's gap). */
  gap?: string;
  amounts: Omit<FundResults, "gap" | "section1411gElection" | "generalRulesLoss">;
  section1411gElection: boolean;
  /* A line 14c loss: the general loss rules (Form 8949), which the engine does not fill from this form. */
  generalRulesLossGap?: string;
  dividendPayers: PayerRow[];
}

const anyElection = (fund: Form8621Fund) =>
  Object.values(fund.fact.elections ?? {}).some((checked) => checked === true);

/*
 * Who files for a fund (::passive-foreign-investment-corporation-pfic::b01):
 * a distribution or gain under section 1291, a QEF or section 1296 fund, an
 * election in Part II, or the annual report of section 1298(f). The $25,000
 * exception lifts the annual report for a section 1291 fund with no excess
 * distribution or gain (::exceptions-to-filing-part-i::b02).
 */
function fundFiles(fund: Form8621Fund, aggregateValue: number, limit: number): boolean {
  const fact = fund.fact;
  if (fund.gap !== undefined || fact.regime !== "section_1291") return true;
  if (anyElection(fund) || fact.qualifyingInsuranceElection === true) return true;
  if ((fact.prior1294Elections ?? []).length > 0) return true;
  if ((section1291Amount(fund.partV) ?? 0) > 0) return true;
  return aggregateValue > limit;
}

const SUMMED = [
  "otherIncome",
  "capitalGain",
  "dividendsUsd",
  "section1291Tax",
  "section1291Interest",
  "deferredTaxDue",
  "deferredTaxInterest",
  "netInvestmentIncomeAddition",
  "netInvestmentIncomeGainExcluded",
  "foreignTaxUsd",
  "foreignTax",
  "foreignIncomeUsd",
] as const;

const GENERAL_RULES_LOSS =
  "Form 8621 line 14c is a loss under the general rules (Form 8949 and Schedule D); the engine does not place it.";

/* The totals from the facts, or undefined with no fund fact. */
export function form8621Totals(inputs: ResolverInputs): Form8621Totals | undefined {
  const facts = getPficFundFacts(inputs.facts);
  if (facts.length === 0) return undefined;
  const funds = facts.map(form8621Fund);
  const joint = filingStatusOf(inputs) === "married_filing_jointly";
  const limit = joint ? PART_I_EXCEPTION_LIMIT_JOINT : PART_I_EXCEPTION_LIMIT;
  const aggregate = sum(...funds.map((fund) => fund.fact.valueAtYearEnd));
  const results = funds.map((fund) => fund.results);
  const amounts = Object.fromEntries(
    SUMMED.map((name) => [name, sum(...results.map((each) => each[name]))]),
  ) as Form8621Totals["amounts"];
  return {
    funds,
    filed: funds.filter((fund) => fundFiles(fund, aggregate, limit)),
    gap: results.find((each) => each.gap !== undefined)?.gap,
    amounts,
    section1411gElection: results.some((each) => each.section1411gElection),
    generalRulesLossGap: results.some((each) => (each.generalRulesLoss ?? 0) < 0)
      ? GENERAL_RULES_LOSS
      : undefined,
    dividendPayers: funds
      .filter((fund) => fund.results.dividendsUsd > 0)
      .map((fund) => ({ payerName: fund.fact.fundName, amount: fund.results.dividendsUsd })),
  };
}

type Amounts = Form8621Totals["amounts"];

/*
 * Form 8960's MAGI upper bound (federal/8960/mustFile.ts): each fund's income
 * above 0 (other income, the QEF gain, the dividends). A fund with a gap adds 0.
 */
export function form8621IncomeUpperBound(inputs: ResolverInputs): number {
  const funds = form8621Totals(inputs)?.funds ?? [];
  return sum(
    ...funds.map(({ results }) =>
      sum(atLeast(0, results.otherIncome), atLeast(0, results.capitalGain), results.dividendsUsd),
    ),
  );
}

/*
 * The schedules the funds' amounts reach, for their must-file rules: Schedule
 * D line 11 (line 7c, or a line 14c loss the engine cannot place) and Schedule
 * 2 lines 17p, 17q and 17z (lines 16f, 24 and 23). A fund's gap reaches both.
 */
export function form8621Feeds(inputs: ResolverInputs) {
  const totals = form8621Totals(inputs);
  const keys = totals?.funds.map((fund) => fund.key) ?? [];
  const gap = totals?.gap !== undefined;
  const amounts = totals?.amounts;
  const scheduleD =
    gap || (amounts?.capitalGain ?? 0) > 0 || totals?.generalRulesLossGap !== undefined;
  const scheduleTwo =
    gap ||
    sum(amounts?.section1291Interest, amounts?.deferredTaxDue, amounts?.deferredTaxInterest) > 0;
  return {
    scheduleTwo,
    scheduleDFallback: {
      rule: "fallback: a QEF's net capital gain on Form 8621 line 7c (line 11)",
      value: scheduleD,
      triggeredByFactKeys: scheduleD ? keys : [],
    },
  };
}

/*
 * A line of another form that adds a Form 8621 amount. With no fund the line
 * is what it was; a fund's gap makes it unsupported; otherwise the amount adds
 * when it is not 0.
 */
export function withForm8621(
  totals: Form8621Totals | undefined,
  own: number | undefined,
  amountOf: (amounts: Amounts) => number,
): number | Unsupported | undefined {
  if (totals === undefined) return own;
  if (totals.gap !== undefined) return unsupported(totals.gap);
  const amount = amountOf(totals.amounts);
  return amount === 0 ? own : sum(own, amount);
}

/* The amount when Form 8621 sends one (not 0, no gap); undefined otherwise. */
export function form8621Amount(
  totals: Form8621Totals | undefined,
  amountOf: (amounts: Amounts) => number,
): number | undefined {
  if (totals === undefined || totals.gap !== undefined) return undefined;
  const amount = amountOf(totals.amounts);
  return amount === 0 ? undefined : amount;
}
