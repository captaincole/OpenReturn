/* FTB 3510 rules, written by hand from ca-3510-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { atLeast } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3510FilingInfo } from "./filingInfo.js";
import {
  figureCreditAvailable,
  figureSectionA,
  figureSectionB,
  line29,
  ratioText,
  type CreditAvailableLines,
  type SectionALines,
  type SectionBLines,
} from "./lines.js";
import { creditAllowedBindings } from "./partII.js";
import type { Form3510 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3510]: BindingFn<Form3510, Form3510FilingInfo, K> }>;
type Info = Form3510FilingInfo;

const SECTION_B_NO_BASE = unsupported(
  "Line 21 divides line 20 by line 16, and line 16 is zero or less; the form does not say what to enter then.",
);

/* Part I is figured only with a 2024 AMT above 0; with none, line 29 is 0 and Part I is blank. */
function sectionA(info: Info): SectionALines | undefined {
  const answers = info.caPriorYearAmtExclusions;
  if ((info.caPriorYearAmt ?? 0) <= 0 || answers === undefined) return undefined;
  return figureSectionA(answers);
}

/* Section B: a 2024 Form 540NR only (line 11: "2024 540NR filers, go to Section B"). */
function sectionB(info: Info): SectionBLines | Unsupported | undefined {
  const lines = sectionA(info);
  const nonresident = info.caPriorYearAmtExclusions?.nonresident;
  if (lines === undefined || info.caPriorYearAmtExclusions?.returnForm !== "540nr")
    return undefined;
  if (nonresident === undefined) return undefined;
  return figureSectionB(lines, nonresident) ?? SECTION_B_NO_BASE;
}

/* Lines 28 to 32; undefined while an answer waits. Section B with no rule leaves them unsupported. */
export function creditAvailable(info: Info): CreditAvailableLines | Unsupported | undefined {
  const { caPriorYearAmt: amt, caPriorYearAmtCreditCarryover: carryover } = info;
  if (amt === undefined || carryover === undefined) return undefined;
  const nonresidentLines = sectionB(info);
  if (nonresidentLines !== undefined && "unsupported" in nonresidentLines) return nonresidentLines;
  const exclusions = line29(atLeast(0, amt), info.caPriorYearAmtExclusions);
  if (exclusions === undefined) return undefined;
  return figureCreditAvailable(atLeast(0, amt), exclusions, atLeast(0, carryover));
}

const fromA = (pick: (lines: SectionALines) => number | undefined) => (_: unknown, info: Info) => {
  const lines = sectionA(info);
  return lines === undefined ? undefined : pick(lines);
};

const fromB =
  <V extends number | string>(pick: (lines: SectionBLines) => V | undefined) =>
  (_: unknown, info: Info): V | Unsupported | undefined => {
    const lines = sectionB(info);
    return lines === undefined || "unsupported" in lines ? lines : pick(lines);
  };

const fromCredit = (pick: (lines: CreditAvailableLines) => number) => (_: unknown, info: Info) => {
  const lines = creditAvailable(info);
  return lines === undefined || "unsupported" in lines ? lines : pick(lines);
};

const sectionABindings: Bindings = {
  "0.line.1_prior_year_schedule_p_amounts": fromA((lines) => lines.line1),
  "0.line.2_exclusion_adjustments_preferences": fromA((lines) => lines.line2),
  "0.line.3_amt_credit_nol_deduction": fromA((lines) => lines.line3),
  "0.line.4_combine_lines_1_through_3": fromA((lines) => lines.line4),
  "0.line.5_exemption_worksheet_line_1": fromA((lines) => lines.line5),
  "0.line.6_exemption_worksheet_line_3": fromA((lines) => lines.line6),
  "0.line.7_line_4_minus_line_6": fromA((lines) => lines.line7),
  "0.line.8_exemption_phaseout_amount": fromA((lines) => lines.line8),
  "0.line.9_exemption_after_phaseout": fromA((lines) => lines.line9),
  "0.line.10_line_4_minus_line_9": fromA((lines) => lines.line10),
  "0.line.11_tentative_minimum_tax_exclusions": fromA((lines) => lines.line11),
  "0.line.12_regular_tax_before_credits": fromA((lines) => lines.line12),
  "0.line.13_net_amt_on_exclusions": fromA((lines) => lines.line13),
};

const sectionBBindings: Bindings = {
  "0.line.14_amount_from_line_4": fromB((lines) => lines.line14),
  "0.line.15_schedule_p_540nr_line_35": fromB((lines) => lines.line15),
  "0.line.16_total_amt_agi_exclusions": fromB((lines) => lines.line16),
  "0.line.17_schedule_p_540nr_line_28": fromB((lines) => lines.line17),
  "0.line.18_ca_exclusion_adjustments_preferences": fromB((lines) => lines.line18),
  "0.line.20_ca_amt_agi_exclusions": fromB((lines) => lines.line20),
  "0.line.21_amt_itemized_deduction_percentage": fromB((lines) =>
    lines.line21 === undefined ? undefined : ratioText(lines.line21),
  ),
  "0.line.22_prorated_amt_itemized_deductions": fromB((lines) => lines.line22),
  "0.line.23_ca_amti_on_exclusions": fromB((lines) => lines.line23),
  "0.line.24_ca_amt_rate_exclusions": fromB((lines) => ratioText(lines.line24)),
  "0.line.25_ca_tentative_minimum_tax_exclusions": fromB((lines) => lines.line25),
  "0.line.26_regular_tax_540nr": fromB((lines) => lines.line26),
  "0.line.27_net_amt_on_exclusions_540nr": fromB((lines) => lines.line27),
};

const creditAvailableBindings: Bindings = {
  "0.line.28_prior_year_amt": fromCredit((lines) => lines.line28),
  "0.line.29_net_amt_on_exclusions": fromCredit((lines) => lines.line29),
  "0.line.30_adjusted_net_amt": fromCredit((lines) => lines.line30),
  "0.line.31_amt_credit_carryover_from_2024": fromCredit((lines) => lines.line31),
  "0.line.32_combine_lines_30_and_31": fromCredit((lines) => lines.line32),
};

/* Every FTB 3510 binding; the unit tests evaluate them without the engine. */
export function form3510Bindings(): Bindings {
  return {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "0.header.ssn_itin_fein": (_, info) => info.taxpayerSSN,
    ...sectionABindings,
    ...sectionBBindings,
    ...creditAvailableBindings,
    ...creditAllowedBindings(),
  };
}

export function register(): void {
  defineForm<Form3510, Form3510FilingInfo>("form-3510", { bindings: form3510Bindings() });
}
