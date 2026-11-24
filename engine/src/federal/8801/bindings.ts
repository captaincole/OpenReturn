/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { line21Of, line22Of, line23Of, lines24To26Of, type Form8801CreditInfo } from "./credit.js";
import type { Form8801PriorYear } from "./filingInfo.js";
import type { Lines11To15, Lines16To21, Lines1To10, Lines24To26 } from "./lines.js";
import type { PartIIILines } from "./partIII.js";
import type { Form8801 } from "./types.js";

type Binding = (form: unknown, info: Form8801CreditInfo) => number | Unsupported | undefined;

/* The gap that stops line 13 and every line after it: line 11's, else line 12's. */
const chainGap = (priorYear: Form8801PriorYear) => priorYear.line11Gap ?? priorYear.line12Gap;

/* MANUAL EDIT: lines 1–10 (lines.ts); a line the form skips is blank. */
const upTo10 =
  (pick: (lines: Lines1To10) => number | undefined): Binding =>
  (_, info) => {
    const priorYear = info.form8801PriorYear;
    return priorYear === undefined ? undefined : pick(priorYear.upTo10);
  };

/* MANUAL EDIT: lines 13 and 15, and Part II: a gap in line 11 or 12 is a gap here. */
const afterGap =
  <T>(
    lines: (priorYear: Form8801PriorYear) => T | undefined,
    pick: (part: T) => number | undefined,
  ): Binding =>
  (_, info) => {
    const priorYear = info.form8801PriorYear;
    if (priorYear === undefined) return undefined;
    const part = lines(priorYear);
    if (part !== undefined) return pick(part);
    const gap = chainGap(priorYear);
    return gap === undefined ? undefined : unsupported(gap);
  };

const upTo15 = (pick: (lines: Lines11To15) => number | undefined) =>
  afterGap((priorYear) => priorYear.upTo15, pick);
const partII = (pick: (lines: Lines16To21) => number | undefined) =>
  afterGap((priorYear) => priorYear.partII, pick);

/* MANUAL EDIT: Part III (partIII.ts): blank unless line 11 takes it; a 2024 Form 2555 makes it a gap. */
const partIII =
  (pick: (lines: PartIIILines) => number | undefined): Binding =>
  (_, info) => {
    const priorYear = info.form8801PriorYear;
    if (priorYear?.partIIIGap !== undefined) return unsupported(priorYear.partIIIGap);
    return priorYear?.partIII === undefined ? undefined : pick(priorYear.partIII);
  };

/* MANUAL EDIT: lines 24–26 (credit.ts), once line 21 is above 0. */
const upTo26 =
  (pick: (lines: Lines24To26) => number): Binding =>
  (form, info) => {
    const lines = lines24To26Of(form as Record<string, unknown>, info);
    return lines === undefined || "unsupported" in lines ? lines : pick(lines);
  };

/* MANUAL EDIT: lines 22 and 23 print only when line 21 is above 0 ("If zero or less, stop here"). */
const afterLine21 =
  (line: typeof line22Of): Binding =>
  (form, info) => {
    const line21 = line21Of(info);
    if (typeof line21 !== "number") return line21;
    return line21 > 0 ? line(form as Record<string, unknown>, info) : undefined;
  };

export function register(): void {
  defineForm<Form8801, Form8801CreditInfo>("form-8801", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.identifying_number": (_, info) => info.taxpayerSSN,
      // MANUAL EDIT: lines 1–3 (irs-8801-inst-2025::sec::line-2::b01, line-3::b01).
      "0.line.1_prior_year_form_6251_lines_1_2e": upTo10((lines) => lines.line1),
      "0.line.2_exclusion_item_adjustments_preferences": upTo10((lines) => lines.line2),
      "0.line.3_minimum_tax_credit_nol_deduction": upTo10((lines) => lines.line3),
      // MANUAL EDIT: line 4 with the 2024 MFS add-on (line-4::b01); lines 5–10 from the 2024 amounts.
      "0.line.4_combine_lines_1_2_3": upTo10((lines) => lines.line4),
      "0.line.5_exemption_amount": upTo10((lines) => lines.line5),
      "0.line.6_exemption_phaseout_threshold": upTo10((lines) => lines.line6),
      "0.line.7_amount_over_phaseout_threshold": upTo10((lines) => lines.line7),
      "0.line.8_exemption_reduction": upTo10((lines) => lines.line8),
      "0.line.9_reduced_exemption": upTo10((lines) => lines.line9),
      "0.line.10_amount_after_exemption": upTo10((lines) => lines.line10),
      // MANUAL EDIT: line 11 (line-11::b01): Part III line 55, or the 2024 AMT rates; Form 2555 is a gap.
      "0.line.11_tax_on_line_10": (_, info) => {
        const priorYear = info.form8801PriorYear;
        if (priorYear?.line11Gap !== undefined) return unsupported(priorYear.line11Gap);
        return priorYear?.line11;
      },
      // MANUAL EDIT: line 12 (line-12::b01): the election's 2024 Schedule 3 line 1; Form 1116 is a gap.
      "0.line.12_minimum_tax_foreign_tax_credit": (_, info) => {
        const priorYear = info.form8801PriorYear;
        if (priorYear?.line12Gap !== undefined) return unsupported(priorYear.line12Gap);
        return priorYear?.line12;
      },
      "0.line.13_tentative_minimum_tax_exclusion_items": upTo15((lines) => lines.line13),
      "0.line.14_prior_year_form_6251_line_10": (_, info) => info.form8801PriorYear?.line14,
      // MANUAL EDIT: line 15 is 0 when line 4 or line 10 is 0 ("enter -0- here and on line 15").
      "0.line.15_net_minimum_tax_exclusion_items": afterGap(
        (priorYear) => priorYear.line15,
        (line15) => line15,
      ),
      "1.line.16_prior_year_tentative_minimum_tax_base": partII((lines) => lines.line16),
      "1.line.17_amount_from_line_15": partII((lines) => lines.line17),
      "1.line.18_line_16_minus_line_17": partII((lines) => lines.line18),
      "1.line.19_prior_year_credit_carryforward": partII((lines) => lines.line19),
      "1.line.20_unallowed_electric_vehicle_credit": partII((lines) => lines.line20),
      "1.line.21_combine_lines_18_through_20": partII((lines) => lines.line21),
      // MANUAL EDIT: lines 22–26 (credit.ts; irs-8801-inst-2025::sec::line-22::b01, line-21::b01).
      "1.line.22_regular_tax_minus_credits": afterLine21(line22Of),
      "1.line.23_current_year_tentative_minimum_tax": afterLine21(line23Of),
      "1.line.24_line_22_minus_line_23": upTo26((lines) => lines.line24),
      "1.line.25_minimum_tax_credit": upTo26((lines) => lines.line25),
      "1.line.26_credit_carryforward_next_year": upTo26((lines) => lines.line26),
      "2.line.27_amount_from_line_10": partIII((lines) => lines.line27),
      "2.line.28_qualified_dividends_worksheet_amount": partIII((lines) => lines.line28),
      "2.line.29_unrecaptured_section_1250_gain": partIII((lines) => lines.line29),
      "2.line.30_smaller_of_sum_or_worksheet": partIII((lines) => lines.line30),
      "2.line.31_smaller_of_line_27_or_30": partIII((lines) => lines.line31),
      "2.line.32_subtract_line_31_from_27": partIII((lines) => lines.line32),
      "2.line.33_tax_at_26_or_28_percent": partIII((lines) => lines.line33),
      "2.line.34_zero_percent_rate_threshold": partIII((lines) => lines.line34),
      "2.line.35_ordinary_taxable_income": partIII((lines) => lines.line35),
      "2.line.36_subtract_line_35_from_34": partIII((lines) => lines.line36),
      "2.line.37_smaller_of_line_27_or_28": partIII((lines) => lines.line37),
      "2.line.38_smaller_of_line_36_or_37": partIII((lines) => lines.line38),
      "2.line.39_subtract_line_38_from_37": partIII((lines) => lines.line39),
      "2.line.40_fifteen_percent_rate_threshold": partIII((lines) => lines.line40),
      "2.line.41_amount_from_line_36": partIII((lines) => lines.line41),
      "2.line.42_worksheet_ordinary_income_amount": partIII((lines) => lines.line42),
      "3.line.43_add_lines_41_42": partIII((lines) => lines.line43),
      "3.line.44_line_40_minus_43": partIII((lines) => lines.line44),
      "3.line.45_smaller_of_39_or_44": partIII((lines) => lines.line45),
      "3.line.46_tax_at_15_percent": partIII((lines) => lines.line46),
      "3.line.47_add_lines_38_45": partIII((lines) => lines.line47),
      "3.line.48_line_37_minus_47": partIII((lines) => lines.line48),
      "3.line.49_tax_at_20_percent": partIII((lines) => lines.line49),
      "3.line.50_add_lines_32_47_48": partIII((lines) => lines.line50),
      "3.line.51_line_27_minus_50": partIII((lines) => lines.line51),
      "3.line.52_tax_at_25_percent": partIII((lines) => lines.line52),
      "3.line.53_add_lines_33_46_49_52": partIII((lines) => lines.line53),
      "3.line.54_tax_at_amt_rates": partIII((lines) => lines.line54),
      "3.line.55_smaller_of_53_or_54": partIII((lines) => lines.line55),
    },

    // The identifying number widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.identifying_number": (value) =>
        SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
