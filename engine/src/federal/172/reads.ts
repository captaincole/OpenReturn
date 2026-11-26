/*
 * Part I's reads of the return, by full field id: Form 1040 lines 11a and
 * 12e, and the return's amounts sorted into business and nonbusiness
 * (irs-172-inst-2025::sec::line-6-nonbusiness-deductions, ::line-7-nonbusiness-income-other-than,
 * ::lines-19-22-capital-loss-limitation). Each read is an amount, the reason
 * the engine cannot sort it, or undefined while a line waits.
 */

import { atLeast, numberOrBlank, sum } from "../../money.js";
import { unsupported } from "../../types.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import type { Form4797FilingInfo } from "../4797/filingInfo.js";
import { scheduleDGainFromForm4797 } from "../4797/receivers.js";
import { line8aHold, type Info as NolDeductionInfo } from "../schedule-1/nolDeduction.js";
import type { Form172FilingInfo } from "./filingInfo.js";
import { isGap, type Amount, type PartIInputs } from "./lines.js";

export type Info = Form172FilingInfo &
  NolDeductionInfo &
  Form4797FilingInfo &
  Pick<Form1040FilingInfo, "useItemizedDeductions" | "increasedStandardDeduction">;
export type Read = Record<string, unknown>;

const SCHEDULE_D = "schedule-d.";
const SCHEDULE_1 = "schedule-1.";

/* Schedule D lines that hold sales of investments: Form 8949 boxes and the lines that bypass it. */
const SALE_LINES = [
  "0.line.1a_gain_loss",
  "0.line.1b_gain_loss",
  "0.line.2_gain_loss",
  "0.line.3_gain_loss",
  "0.line.8a_gain_loss",
  "0.line.8b_gain_loss",
  "0.line.9_gain_loss",
  "0.line.10_gain_loss",
];
/* Schedule D lines 4, 5 and 12: other forms and K-1s, which the instructions do not sort. */
const UNSORTED_CAPITAL_LINES = [
  "0.line.4_short_term_gain_other_forms",
  "0.line.5_net_short_term_passthrough",
  "0.line.12_net_long_term_passthrough",
];

/*
 * Line 7's income, named by the instructions: "ordinary dividends, annuities,
 * and interest on investments", taxable IRA distributions, pensions and
 * social security benefits (::line-7-nonbusiness-income-other-than::b01).
 * Schedule 1 lines 1 (taxable refunds), 2a (alimony received), 8b
 * (gambling), 8f (HSA distributions) and 8g (the Alaska dividend) are read as
 * nonbusiness too (QUESTIONS.md).
 */
const NONBUSINESS_INCOME = [
  "form-1040.line.2b",
  "form-1040.line.3b",
  "form-1040.line.4b",
  "form-1040.line.5b",
  "form-1040.line.6b",
  "schedule-1.0.line.1",
  "schedule-1.0.line.2a",
  "schedule-1.0.line.8b",
  "schedule-1.0.line.8f",
  "schedule-1.0.line.8g",
];
/* Schedule 1 line 8 income the instructions do not sort. */
const UNSORTED_INCOME = "cehijklmnoqrstuvz"
  .split("")
  .map((letter) => `schedule-1.0.line.8${letter}`);
/* Schedule E royalties, estate and trust income, and REMIC income: the instructions do not sort them. */
const UNSORTED_SCHEDULE_E = [
  "schedule-e.0.line.23b_total_royalties",
  "schedule-e.1.line.37_total_estate_trust_income",
  "schedule-e.1.line.39_remic_income_combined",
];

/*
 * Line 6's adjustments: HSA (13), self-employed SEP, SIMPLE and qualified
 * plans (16), alimony paid (19a), IRA (20) and Archer MSA (23), named by the
 * instructions; the early withdrawal penalty (18) and student loan interest
 * (21) are read as nonbusiness too (QUESTIONS.md). Lines 11, 12, 14, 15 and 17
 * are business deductions (::line-6-nonbusiness-deductions::b02).
 */
const NONBUSINESS_ADJUSTMENTS = ["13", "16", "18", "19a", "20", "21", "23"].map(
  (line) => `schedule-1.1.line.${line}`,
);

export const CAPITAL_OTHER_FORMS_GAP =
  "Schedule D holds a gain or loss from another form or a K-1 (lines 4, 5, 12, or line 11 beyond Form 4797) that the instructions do not sort into business and nonbusiness capital gains and losses.";
export const CAPITAL_NETTED_GAP =
  "The stated business capital gain or loss is more than the Schedule D lines on its side hold, so lines 2, 3, 11 and 12 cannot be sorted.";
export const CAPITAL_TOTAL_GAP =
  "The Schedule D lines the engine sorts do not add up to Schedule D line 16, so lines 2, 3, 11 and 12 cannot be sorted.";
export const STATE_INCOME_TAX_GAP =
  "The itemized deductions include state and local income tax: the part on income from a trade or business, wages included, is a business deduction (irs-172-inst-2025::sec::line-6-nonbusiness-deductions::b02), and the instructions do not say how to split it, or the capped total, between business and nonbusiness income.";
export const INCREASED_STANDARD_GAP =
  "The standard deduction is increased by a net qualified disaster loss: the instructions name a disaster loss as a business deduction only for a taxpayer who itemizes, so line 6 cannot be sorted.";
export const OTHER_ADJUSTMENTS_GAP =
  "Schedule 1 line 25 holds other adjustments (lines 24a to 24z) that the instructions do not sort into business and nonbusiness deductions.";
export const OTHER_INCOME_GAP =
  "Schedule 1 line 8 or Schedule E holds income the instructions do not sort into business and nonbusiness income (line 8 items other than 8b, 8f, 8g and 8p; royalties; estate, trust or REMIC income).";

type CapitalInputs = Pick<
  PartIInputs,
  | "nonbusinessCapitalLosses"
  | "nonbusinessCapitalGains"
  | "businessCapitalLosses"
  | "businessCapitalGains"
  | "scheduleDLoss"
>;

const everyCapitalLine = (value: Amount): CapitalInputs => ({
  nonbusinessCapitalLosses: value,
  nonbusinessCapitalGains: value,
  businessCapitalLosses: value,
  businessCapitalGains: value,
  scheduleDLoss: value,
});

/* Without Schedule D, Form 1040 line 7a holds only capital gain distributions (nonbusiness). */
function withoutScheduleD(form: Read): CapitalInputs {
  const distributions = atLeast(0, numberOrBlank(form["form-1040.line.7a"]));
  return { ...everyCapitalLine(0), nonbusinessCapitalGains: distributions };
}

/*
 * Lines 2, 3, 11, 12 and 16 from Schedule D. Sales of investments, capital
 * gain distributions (line 13) and the carryovers (lines 6 and 14) are
 * nonbusiness; Form 4797's section 1231 gain on line 11 is a business capital
 * gain; the stated business capital gain or loss (the Form 461 answer) moves
 * from the sales to lines 11 and 12. A Schedule D line is a net of its rows,
 * so line 2 adds the lines below 0 and line 3 the lines above 0 (QUESTIONS.md).
 */
function scheduleDInputs(form: Read, info: Info, line16: number): CapitalInputs {
  const read = (line: string) => sum(form[`${SCHEDULE_D}${line}`]);
  const from4797 = scheduleDGainFromForm4797(info);
  if (isGap(from4797)) return everyCapitalLine(from4797);
  const line11Other = read("0.line.11_long_term_gain_other_forms") - sum(from4797);
  if (line11Other !== 0 || UNSORTED_CAPITAL_LINES.some((line) => read(line) !== 0)) {
    return everyCapitalLine(unsupported(CAPITAL_OTHER_FORMS_GAP));
  }
  const sales = SALE_LINES.map(read);
  const losses =
    sum(...sales.map((net) => atLeast(0, -net))) +
    read("0.line.6_short_term_loss_carryover") +
    read("0.line.14_long_term_loss_carryover");
  const gains =
    sum(...sales.map((net) => atLeast(0, net))) + read("0.line.13_capital_gain_distributions");
  const business = info.form172?.businessCapitalNet ?? 0;
  const businessGain = atLeast(0, business);
  const businessLoss = atLeast(0, -business);
  if (businessGain > gains || businessLoss > losses) {
    return everyCapitalLine(unsupported(CAPITAL_NETTED_GAP));
  }
  const inputs: CapitalInputs = {
    nonbusinessCapitalLosses: losses - businessLoss,
    nonbusinessCapitalGains: gains - businessGain,
    businessCapitalLosses: businessLoss,
    businessCapitalGains: businessGain + sum(from4797),
    scheduleDLoss: line16 < 0 ? -line16 : 0,
  };
  const total = gains - losses + sum(from4797);
  return total === line16 ? inputs : everyCapitalLine(unsupported(CAPITAL_TOTAL_GAP));
}

/* The capital lines; undefined while Schedule D files and its line 16 waits. */
export function capitalInputs(form: Read, info: Info): CapitalInputs | undefined {
  const line16 = numberOrBlank(form[`${SCHEDULE_D}1.line.16_combined_gain_loss`]);
  if (line16 !== undefined) return scheduleDInputs(form, info, line16);
  return info.mustFile?.["schedule-d"]?.value === true ? undefined : withoutScheduleD(form);
}

/*
 * Line 6: the standard deduction, or the itemized deductions less the
 * casualty and theft loss (a federally declared disaster loss is a business
 * deduction), plus the nonbusiness adjustments (::line-6-nonbusiness-deductions::b01).
 */
export function nonbusinessDeductions(form: Read, info: Info, deduction: number): Amount {
  const adjustments = sum(...NONBUSINESS_ADJUSTMENTS.map((id) => form[id]));
  if (sum(form[`${SCHEDULE_1}1.line.25`]) !== 0) return unsupported(OTHER_ADJUSTMENTS_GAP);
  if (info.useItemizedDeductions !== true) {
    if (info.increasedStandardDeduction === true) return unsupported(INCREASED_STANDARD_GAP);
    return deduction + adjustments;
  }
  const salesTax = form["schedule-a.0.line.5a_general_sales_tax_election"] === true;
  if (!salesTax && sum(form["schedule-a.0.line.5a_state_local_income_or_sales_tax"]) > 0) {
    return unsupported(STATE_INCOME_TAX_GAP);
  }
  return deduction - sum(form["schedule-a.0.line.15_casualty_theft_loss"]) + adjustments;
}

/* Line 7; the gap when the return holds income the instructions do not sort. */
export function nonbusinessIncome(form: Read): Amount {
  const unsorted = [...UNSORTED_INCOME, ...UNSORTED_SCHEDULE_E].some((id) => sum(form[id]) !== 0);
  if (unsorted) return unsupported(OTHER_INCOME_GAP);
  return sum(...NONBUSINESS_INCOME.map((id) => form[id]));
}

/* Line 23: Schedule 1 line 8a, positive; its gap; undefined while it waits. */
export function nolDeductionOtherYears(form: Read, info: Info): Amount | undefined {
  const value = form[`${SCHEDULE_1}0.line.8a`];
  const hold = line8aHold(value, info);
  if (hold === "waiting") return undefined;
  return hold ?? sum(value);
}
