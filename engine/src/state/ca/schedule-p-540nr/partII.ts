/*
 * Schedule P (540NR) Part II lines 25 to 45: the tentative minimum tax on
 * California AMTI. Lines 22 to 24 (the exemption and the tax on total AMTI)
 * are Schedule P (540)'s rules (bindings.ts). Each line here reads the form
 * and calls the arithmetic in lines.ts.
 */

import type { FormAccessor } from "../../../defineForm.js";
import { ISO_SOLD_IN_YEAR_UNSUPPORTED } from "../../../isoSpread.js";
import { numberOrBlank, roundDollars, sumOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import { gapFor } from "../540nr/form540NRBinding.js";
import { prorated, ratioDigits } from "../540nr/lines.js";
import { itemizesForCalifornia } from "../schedule-p/bindings.js";
import type { ScheduleP540NRFilingInfo } from "./filingInfo.js";
import { asScheduleP, type Bind } from "./fromScheduleP.js";
import {
  alternativeMinimumTax,
  amtItemizedDeductionPercentage,
  californiaAgiForAmt,
  californiaAmtAgi,
  californiaAmtRate,
  californiaTmt,
  totalAmtItemizedDeductions,
} from "./lines.js";
import type { ScheduleP540NR } from "./types.js";

type Form = FormAccessor<ScheduleP540NR>;
type Info = ScheduleP540NRFilingInfo;

const itemizes = (form: Form, info: Info) => itemizesForCalifornia(asScheduleP(form), info);
const positiveOrBlank = (value: number | undefined) =>
  value !== undefined && value > 0 ? value : undefined;
const ratioText = (ratio: number) => {
  const { whole, decimals } = ratioDigits(ratio);
  return `${whole}.${decimals}`;
};

// Line 25: "California adjusted gross income (AGI) from Schedule CA (540NR), Part IV, line 1" (the form).
const line25: Bind = (form) => numberOrBlank(form["schedule-ca-540nr.4.part4.1_california_agi"]);

/*
 * Line 26: "NOL adjustment, if any, included on Schedule CA (540NR), Part II,
 * Section B, line 9b1, line 9b2, and line 9b3, column E. Enter as a positive
 * number" (the form). Column E holds the deduction as a negative amount, as
 * column D does (schedule-ca-540nr/columns.ts).
 */
const line26: Bind = (form) => {
  const columnE = sumOrBlank(
    form["schedule-ca-540nr.2.line.b9b1_ca_amounts"],
    form["schedule-ca-540nr.2.line.b9b2_ca_amounts"],
    form["schedule-ca-540nr.2.line.b9b3_ca_amounts"],
  );
  return positiveOrBlank(columnE === undefined ? undefined : Math.abs(columnE));
};

// Line 28: "Combine line 25 through line 27"; line 27 is in parentheses (the form).
const line28: Bind = (form) => {
  const caAgi = numberOrBlank(form["1.line.25_california_agi"]);
  if (caAgi === undefined) return undefined;
  return californiaAgiForAmt(
    caAgi,
    numberOrBlank(form["1.line.26_nol_adjustment"]) ?? 0,
    numberOrBlank(form["1.line.27_amti_exclusion"]) ?? 0,
  );
};

/* Lines 29a to 29r, in the form's order (the catalog lists them in two columns). */
export const LINE_29_ITEMS = [
  "1.line.29a_investment_interest_expense",
  "1.line.29b_post_1986_depreciation",
  "1.line.29c_adjusted_gain_loss",
  "1.line.29d_iso_cqso",
  "1.line.29e_passive_activities",
  "1.line.29f_estate_trust_beneficiaries",
  "1.line.29g_circulation_expenditures",
  "1.line.29h_depletion",
  "1.line.29i_installment_sales",
  "1.line.29j_intangible_drilling_costs",
  "1.line.29k_long_term_contracts",
  "1.line.29l_loss_limitations",
  "1.line.29m_mining_costs",
  "1.line.29n_patrons_adjustment",
  "1.line.29o_pollution_control_facilities",
  "1.line.29p_research_experimental",
  "1.line.29q_tax_shelter_farm_activities",
  "1.line.29r_related_adjustments",
] as const;

/*
 * The FTB 3526 gap of Part I lines 7 and 14 and of lines 29a and 34e: FTB 3526
 * is figured for Form 540 only. It counts only for a return that itemizes: "If
 * you did not itemize deductions and had investment interest expense, do not
 * enter an adjustment"
 * (ca-540nr-sched-p-inst-2025::sec::line-7-investment-interest-expense-adjustment::b02).
 */
export const ftb3526Gap = (form: Form, info: Info) =>
  itemizes(form, info) === false ? undefined : gapFor(info, "form-3526");

/*
 * Line 29a: the California part of Part I line 7. The engine figures line 7
 * only for a return that itemizes, and only from FTB 3526 (Schedule P (540)
 * line 7), which it figures for Form 540 only: with FTB 3526 needed the line
 * carries that gap, else Part I line 7 is blank and so is this line. An
 * itemizer's line 7 reaches California AMTI through line 34e and the
 * proration of lines 35 to 39 (QUESTIONS.md).
 */
const line29a: Bind = ftb3526Gap;

/*
 * Line 29d: "Enter on line 29a through line 29r the amounts that relate to
 * income and deductions shown on Schedule CA (540NR), Part II, column E"
 * (ca-540nr-sched-p-inst-2025::sec::line-29-adjustments-and-preferences::b01):
 * the stated California part of Part I line 10's spread. Part I line 10's
 * gap carries; with a spread and no stated part the line waits (resolveInfo.ts).
 */
const line29d: Bind = (form, info) => {
  if (info.isoSharesSoldInYear) return unsupported(ISO_SOLD_IN_YEAR_UNSUPPORTED);
  const spread = numberOrBlank(form["0.line.10_iso_cqso"]);
  if (spread === undefined) return undefined;
  const stated = info.isoCaliforniaSpread;
  return stated === undefined ? undefined : positiveOrBlank(roundDollars(stated));
};

/* A Part I line 10 spread with no stated California part: lines 29 to 45 wait. */
const isoPartWaits = (form: Form, info: Info) =>
  numberOrBlank(form["0.line.10_iso_cqso"]) !== undefined && info.isoCaliforniaSpread === undefined;

// Line 29: "Add amounts on line a through line r, and enter total here" (the form).
const line29: Bind = (form, info) =>
  isoPartWaits(form, info) ? undefined : sumOrBlank(...LINE_29_ITEMS.map((item) => form[item]));

// Line 30: "Combine line 28 and line 29" (the form).
const line30: Bind = (form, info) => {
  const line28Amount = numberOrBlank(form["1.line.28_combine_lines_25_through_27"]);
  if (line28Amount === undefined || isoPartWaits(form, info)) return undefined;
  return line28Amount + (numberOrBlank(form["1.line.29_adjustments_preferences_total"]) ?? 0);
};

// Line 32: "Subtract line 31 from line 30" (the form); line 31 is a gap, read as blank, as Part I line 20 is.
const line32: Bind = (form) => {
  const line30Amount = numberOrBlank(form["1.line.30_combine_lines_28_and_29"]);
  if (line30Amount === undefined) return undefined;
  return californiaAmtAgi(
    line30Amount,
    0,
    numberOrBlank(form["1.line.31_california_amt_nol_deduction"]) ?? 0,
  );
};

/* Lines 33 to 39 only "If you itemized deductions" (line 32 on the form). */
const whenItemized =
  (bind: Bind): Bind =>
  (form, info) =>
    itemizes(form, info) === true ? bind(form, info) : undefined;

// Line 33: "Enter the amount from Schedule CA (540NR), Part III, line 28" (the form).
const line33: Bind = whenItemized((form) =>
  numberOrBlank(form["schedule-ca-540nr.4.part3.28_itemized_after_adjustments"]),
);

/* Lines 34a to 34e copy Part I lines 2, 3, 4, 5 and 7 (the form), gaps included. */
const copyOfPartI =
  (field: keyof ScheduleP540NR, gap?: Bind): Bind =>
  (form, info) =>
    whenItemized((each) => numberOrBlank(each[field]) ?? gap?.(each, info))(form, info);

const PART_I_4_REASON =
  "Part I line 4 is not figured: no fact on the use of home-equity loan proceeds (Schedule P (540) line 4).";

const LINE_34_ITEMS = [
  "1.line.34a_medical_dental_expense",
  "1.line.34b_personal_real_property_taxes",
  "1.line.34c_home_mortgage_interest",
  "1.line.34d_miscellaneous_itemized_deductions",
  "1.line.34e_investment_interest_adjustment",
] as const;

// Line 34: "Combine amounts on line a through line e, and enter total here", in parentheses (the form).
const line34: Bind = whenItemized((form) => sumOrBlank(...LINE_34_ITEMS.map((item) => form[item])));

// Line 35: "Combine line 33 and line 34" (the form).
const line35: Bind = whenItemized((form) => {
  const itemized = numberOrBlank(form["1.line.33_itemized_deductions"]);
  if (itemized === undefined) return undefined;
  const included = numberOrBlank(form["1.line.34_itemized_deductions_part1_total"]) ?? 0;
  return totalAmtItemizedDeductions(itemized, included);
});

// Line 36: "Enter the amount from Part I, line 21" (the form).
const line36: Bind = whenItemized((form) =>
  numberOrBlank(form["0.line.21_alternative_minimum_taxable_income"]),
);

// Line 37: "Add line 35 and line 36" (the form).
const line37: Bind = whenItemized((form) => {
  const amtItemized = numberOrBlank(form["1.line.35_total_amt_itemized_deductions"]);
  const amti = numberOrBlank(form["1.line.36_total_amti"]);
  return amtItemized === undefined || amti === undefined ? undefined : amtItemized + amti;
});

function line38Ratio(form: Form): number | undefined {
  const caAmtAgi = numberOrBlank(form["1.line.32_california_amt_agi"]);
  const totalAmtAgi = numberOrBlank(form["1.line.37_total_amt_agi"]);
  if (caAmtAgi === undefined || totalAmtAgi === undefined) return undefined;
  return amtItemizedDeductionPercentage(caAmtAgi, totalAmtAgi);
}

// Line 38: "Divide line 32 by line 37. Do not enter more than 1.0000" (the form).
const line38: Bind = whenItemized((form) => {
  const ratio = line38Ratio(form);
  return ratio === undefined ? undefined : ratioText(ratio);
});

// Line 39: "Multiply line 35 by line 38" (the form), the ratio as entered.
const line39: Bind = whenItemized((form) => {
  const ratio = line38Ratio(form);
  const amtItemized = numberOrBlank(form["1.line.35_total_amt_itemized_deductions"]);
  if (ratio === undefined || amtItemized === undefined) return undefined;
  return prorated(amtItemized, ratio);
});

/*
 * Line 40: "Subtract line 39 from line 32"; without itemized deductions, line
 * 32 is entered "here and on line 40" (the form).
 */
const line40: Bind = (form, info) => {
  const caAmtAgi = numberOrBlank(form["1.line.32_california_amt_agi"]);
  const itemized = itemizes(form, info);
  if (caAmtAgi === undefined || itemized === undefined) return undefined;
  if (!itemized) return caAmtAgi;
  const prorated = numberOrBlank(form["1.line.39_prorated_amt_itemized_deductions"]);
  return prorated === undefined ? undefined : caAmtAgi - prorated;
};

// Line 41: "Enter the amount from line 24" (the form).
const line41: Bind = (form) => numberOrBlank(form["1.line.24_total_tentative_minimum_tax"]);

function line42Rate(form: Form): number | undefined {
  const totalTmt = numberOrBlank(form["1.line.41_total_tmt"]);
  const totalAmti = numberOrBlank(form["0.line.21_alternative_minimum_taxable_income"]);
  if (totalTmt === undefined || totalAmti === undefined) return undefined;
  return californiaAmtRate(totalTmt, totalAmti);
}

// Line 42: "Divide line 41 by amount from Part I, line 21" (the form).
const line42: Bind = (form) => {
  const rate = line42Rate(form);
  return rate === undefined ? undefined : ratioText(rate);
};

/*
 * "If line 23 is zero or less, enter -0- on line 23, line 24, and line 43. Go
 * to line 44" (ca-540nr-sched-p-inst-2025::sec::line-23::b01): with no
 * tentative minimum tax on total AMTI, lines 25 to 42 are skipped (blank).
 */
const noTotalTmt = (form: Form) => {
  const line23 = numberOrBlank(form["1.line.23_amti_less_exemption"]);
  return line23 !== undefined && line23 <= 0;
};
const unlessSkipped =
  (bind: Bind): Bind =>
  (form, info) =>
    noTotalTmt(form) ? undefined : bind(form, info);

// Line 43: "Multiply line 40 by line 42"; -0- when line 23 is (::line-23::b01).
const line43: Bind = (form) => {
  if (noTotalTmt(form)) return 0;
  const rate = line42Rate(form);
  const caAmti = numberOrBlank(form["1.line.40_california_amti"]);
  const line23 = numberOrBlank(form["1.line.23_amti_less_exemption"]);
  if (rate === undefined || caAmti === undefined || line23 === undefined) return undefined;
  return californiaTmt(caAmti, rate, line23);
};

// Line 44: "Regular Tax. Enter the amount from Form 540NR, line 37" (the form).
const line44: Bind = (form) =>
  numberOrBlank(form["form-540nr.1.line.37_ca_tax_before_exemption_credits"]);

// Line 45: "Subtract line 44 from line 43. If zero or less, enter -0-" (the form).
const line45: Bind = (form) => {
  const tmt = numberOrBlank(form["1.line.43_california_tmt"]);
  const regular = numberOrBlank(form["1.line.44_regular_tax"]);
  return tmt === undefined || regular === undefined
    ? undefined
    : alternativeMinimumTax(tmt, regular);
};

const LINES_25_TO_42: Readonly<Record<string, Bind>> = {
  "1.line.25_california_agi": line25,
  "1.line.26_nol_adjustment": line26,
  "1.line.28_combine_lines_25_through_27": line28,
  "1.line.29a_investment_interest_expense": line29a,
  "1.line.29d_iso_cqso": line29d,
  "1.line.29_adjustments_preferences_total": line29,
  "1.line.30_combine_lines_28_and_29": line30,
  "1.line.32_california_amt_agi": line32,
  "1.line.33_itemized_deductions": line33,
  "1.line.34a_medical_dental_expense": copyOfPartI("0.line.2_medical_dental_expenses"),
  "1.line.34b_personal_real_property_taxes": copyOfPartI("0.line.3_personal_real_property_taxes"),
  "1.line.34c_home_mortgage_interest": whenItemized(() => unsupported(PART_I_4_REASON)),
  "1.line.34d_miscellaneous_itemized_deductions": copyOfPartI(
    "0.line.5_miscellaneous_itemized_deductions",
  ),
  "1.line.34e_investment_interest_adjustment": copyOfPartI(
    "0.line.7_investment_interest_adjustment",
    ftb3526Gap,
  ),
  "1.line.34_itemized_deductions_part1_total": line34,
  "1.line.35_total_amt_itemized_deductions": line35,
  "1.line.36_total_amti": line36,
  "1.line.37_total_amt_agi": line37,
  "1.line.38_amt_itemized_deduction_percentage": line38,
  "1.line.39_prorated_amt_itemized_deductions": line39,
  "1.line.40_california_amti": line40,
  "1.line.41_total_tmt": line41,
  "1.line.42_california_amt_rate": line42,
};

export const PART_II_BINDINGS: Readonly<Record<string, Bind>> = {
  ...Object.fromEntries(
    Object.entries(LINES_25_TO_42).map(([field, bind]) => [field, unlessSkipped(bind)]),
  ),
  "1.line.43_california_tmt": line43,
  "1.line.44_regular_tax": line44,
  "1.line.45_alternative_minimum_tax": line45,
};
