/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm, type BindingFn } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import { SSN, ssnOf } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import type { AdoptionChildRow } from "./filingInfo.js";
import { LINE_1_ROW_COUNT, ratioText, type PartIIColumn } from "./lines.js";
import type { PartIIIColumn } from "./partIII.js";
import { creditLimitOf, partIIIOf, partIIOf, type Info8839 } from "./results.js";
import type { Form8839 } from "./types.js";

type Fn = BindingFn<Form8839, Info8839, keyof Form8839>;
type Bindings = Partial<{ [K in keyof Form8839]: BindingFn<Form8839, Info8839, K> }>;
type Value = string | number | boolean | undefined;

const OVERFLOW = unsupported(
  "More than three children go on another Form 8839 (irs-8839-inst-2025::sec::more-than-three-eligible-children::b01); the engine prints one form, and its totals count every child.",
);

/* Column (c) checks a child born before 2008 who is disabled (more-than-three-eligible-children::b01). */
const BORN_BEFORE = 2008;

/* The child of a column, the overflow reason past three children, or undefined for an empty column. */
function rowAt(info: Info8839, index: number): AdoptionChildRow | Unsupported | undefined {
  const rows = info.adoptionChildren ?? [];
  return rows.length > LINE_1_ROW_COUNT ? OVERFLOW : rows[index];
}

/* MANUAL EDIT: line 1 (specific-instructions::b01): one row per child fact, in fact order. */
function line1Bindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (let index = 0; index < LINE_1_ROW_COUNT; index++) {
    const read =
      (pick: (row: AdoptionChildRow) => Value): Fn =>
      (_, info) => {
        const row = rowAt(info, index);
        return row === undefined || "unsupported" in row ? row : pick(row);
      };
    const row = `0.line.1_row${index + 1}`;
    out[`${row}_col_a_first`] = read((each) => each.child.firstName);
    out[`${row}_col_a_last`] = read((each) => each.child.lastName);
    out[`${row}_col_b`] = read((each) => String(each.child.birthYear));
    out[`${row}_col_c`] = read((each) =>
      each.child.birthYear < BORN_BEFORE && each.child.disabled === true ? true : undefined,
    );
    out[`${row}_col_d`] = read((each) => (each.child.specialNeeds === true ? true : undefined));
    out[`${row}_col_e`] = read((each) => (each.child.foreign === true ? true : undefined));
    out[`${row}_col_f`] = read((each) => ssnOf(each.child.tin));
    // Column (g): final in 2025 or earlier (line-2::b02).
    out[`${row}_col_g`] = read((each) =>
      each.child.finalYear !== undefined && each.child.finalYear <= 2025 ? true : undefined,
    );
  }
  return out as Bindings;
}

/* A column of Part II or III: the part's value, or the column's overflow or empty state. */
function columnOf<C>(
  result: { columns: C[] } | Unsupported | undefined,
  info: Info8839,
  index: number,
): C | Unsupported | undefined {
  if (result === undefined || "unsupported" in result) return result;
  const row = rowAt(info, index);
  if (row === undefined || "unsupported" in row) return row;
  return result.columns[index];
}

const PART_II_COLUMNS: Array<[string, keyof PartIIColumn]> = [
  ["0.line.2_maximum_adoption_credit_child_", "line2"],
  ["0.line.3_prior_year_amount_child_", "line3"],
  ["0.line.4_credit_limit_remaining_child_", "line4"],
  ["0.line.5_qualified_adoption_expenses_child_", "line5"],
  ["0.line.6_smaller_of_4_or_5_child_", "line6"],
  ["0.line.10_phaseout_reduction_child_", "line10"],
  ["0.line.11a_credit_after_phaseout_child_", "line11a"],
  ["0.line.11b_smaller_of_11a_or_5000_child_", "line11b"],
];

const PART_III_COLUMNS: Array<[string, keyof PartIIIColumn]> = [
  ["1.line.19_maximum_exclusion_child_", "line19"],
  ["1.line.20_prior_year_benefits_child_", "line20"],
  ["1.line.21_subtract_line_20_child_", "line21"],
  ["1.line.22_employer_benefits_received_child_", "line22"],
  ["1.line.24_smaller_of_21_or_22_child_", "line24"],
  ["1.line.28_multiply_line_24_child_", "line28"],
  ["1.line.29_excluded_benefits_child_", "line29"],
];

/* MANUAL EDIT: the per-child lines of Parts II and III, one column per child. */
function columnBindings(): Bindings {
  const out: Record<string, Fn> = {};
  for (let index = 0; index < LINE_1_ROW_COUNT; index++) {
    for (const [prefix, line] of PART_II_COLUMNS) {
      out[`${prefix}${index + 1}`] = (form, info) => {
        const column = columnOf(partIIOf(form, info), info, index);
        return column === undefined || "unsupported" in column ? column : column[line];
      };
    }
    for (const [prefix, line] of PART_III_COLUMNS) {
      out[`${prefix}${index + 1}`] = (form, info) => {
        const column = columnOf(partIIIOf(form, info), info, index);
        return column === undefined || "unsupported" in column ? column : column[line];
      };
    }
  }
  return out as Bindings;
}

/* A total line of a part: the part's gap, blank while it is blank, else the picked value. */
function totalOf<R extends object, V extends Value>(
  result: R | Unsupported | undefined,
  pick: (part: R) => V,
): V | Unsupported | undefined {
  if (result === undefined || "unsupported" in result) return result;
  return pick(result);
}

/* MANUAL EDIT: the "Did you file / receive … for a prior year" boxes: Yes when any child has one. */
type BoxFn = BindingFn<Form8839, Info8839, "0.line.3_prior_year_form_8839_no">;

const priorBox =
  (line: "credit" | "benefits", yes: boolean, part: "II" | "III"): BoxFn =>
  (form, info) =>
    totalOf<object, true | undefined>(
      part === "II" ? partIIOf(form, info) : partIIIOf(form, info),
      () => {
        const rows = info.adoptionChildren ?? [];
        const filed = rows.some((row) =>
          line === "credit" ? row.priorCreditFiled : row.priorBenefitsFiled,
        );
        return filed === yes ? true : undefined;
      },
    );

function partIIBindings(): Bindings {
  return {
    "0.line.3_prior_year_form_8839_no": priorBox("credit", false, "II"),
    "0.line.3_prior_year_form_8839_yes": priorBox("credit", true, "II"),
    // MANUAL EDIT: line 7 (line-7::b01): Form 1040 line 11b plus Form 4563 line 15; Form 2555 is a gap (results.ts).
    "0.line.7_modified_adjusted_gross_income": (form, info) =>
      totalOf(partIIOf(form, info), (part) => part.line7),
    "0.line.8_magi_over_threshold_no": (form, info) =>
      totalOf(partIIOf(form, info), (part) => (part.phaseOut.over ? undefined : true)),
    "0.line.8_magi_over_threshold_yes": (form, info) =>
      totalOf(partIIOf(form, info), (part) => (part.phaseOut.over ? true : undefined)),
    "0.line.8_magi_excess_amount": (form, info) =>
      totalOf(partIIOf(form, info), (part) => part.phaseOut.excess),
    "0.line.9_phaseout_decimal_whole": (form, info) =>
      totalOf(partIIOf(form, info), (part) =>
        part.phaseOut.over ? ratioText(part.phaseOut.thousandths).whole : undefined,
      ),
    "0.line.9_phaseout_decimal_fraction": (form, info) =>
      totalOf(partIIOf(form, info), (part) =>
        part.phaseOut.over ? ratioText(part.phaseOut.thousandths).fraction : undefined,
      ),
    "0.line.11c_total_line_11b": (form, info) =>
      totalOf(partIIOf(form, info), (part) => part.line11c),
    "0.line.12_total_line_11a": (form, info) =>
      totalOf(partIIOf(form, info), (part) => part.line12),
    // MANUAL EDIT: line 13 is line 11c (line-13::b01); Form 1040 line 30 reads it.
    "0.line.13_refundable_adoption_credit": (form, info) =>
      totalOf(partIIOf(form, info), (part) => part.line13),
    "0.line.14_credit_less_refundable": (form, info) =>
      totalOf(partIIOf(form, info), (part) => part.line14),
    // MANUAL EDIT: lines 15 and 16 wait for the carryforward answer (0 when none).
    "0.line.15_credit_carryforward_prior_years": (form, info) =>
      totalOf(partIIOf(form, info), (part) =>
        info.adoptionCarryforward === undefined ? undefined : part.line15,
      ),
    "0.line.16_add_lines_14_and_15": (form, info) =>
      totalOf(partIIOf(form, info), (part) =>
        info.adoptionCarryforward === undefined ? undefined : part.line16,
      ),
    // MANUAL EDIT: credit-limit-worksheet-line-17::b01; line 18 goes on Schedule 3 line 6c.
    "0.line.17_credit_limit_worksheet_amount": (form, info) =>
      totalOf(creditLimitOf(form, info), (limit) => limit.line17),
    "0.line.18_nonrefundable_adoption_credit": (form, info) =>
      totalOf(creditLimitOf(form, info), (limit) => limit.line18),
  };
}

function partIIIBindings(): Bindings {
  return {
    "1.line.20_prior_year_benefits_no": priorBox("benefits", false, "III"),
    "1.line.20_prior_year_benefits_yes": priorBox("benefits", true, "III"),
    "1.line.23_total_employer_benefits": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => part.line23),
    // MANUAL EDIT: line 25, the MAGI Worksheet (modified-adjusted-gross-income-magi-worksheet-line-25::b01, b02).
    "1.line.25_modified_agi": (form, info) => totalOf(partIIIOf(form, info), (part) => part.line25),
    "1.line.26_more_than_259190_no": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => (part.phaseOut.over ? undefined : true)),
    "1.line.26_more_than_259190_yes": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => (part.phaseOut.over ? true : undefined)),
    "1.line.26_magi_over_259190": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => part.phaseOut.excess),
    "1.line.27_phaseout_decimal_whole": (form, info) =>
      totalOf(partIIIOf(form, info), (part) =>
        part.phaseOut.over ? ratioText(part.phaseOut.thousandths).whole : undefined,
      ),
    "1.line.27_phaseout_decimal_fraction": (form, info) =>
      totalOf(partIIIOf(form, info), (part) =>
        part.phaseOut.over ? ratioText(part.phaseOut.thousandths).fraction : undefined,
      ),
    "1.line.30_total_excluded_benefits": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => part.line30),
    // MANUAL EDIT: line 31 is negative when line 30 is more than line 23 (the Yes box).
    "1.line.31_line_30_more_than_23_no": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => (part.line30MoreThan23 ? undefined : true)),
    "1.line.31_line_30_more_than_23_yes": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => (part.line30MoreThan23 ? true : undefined)),
    "1.line.31_taxable_benefits": (form, info) =>
      totalOf(partIIIOf(form, info), (part) => part.line31),
  };
}

export function register(): void {
  defineForm<Form8839, Info8839>("form-8839", {
    bindings: {
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      "0.header.ssn": (_, info) => info.taxpayerSSN,
      ...line1Bindings(),
      ...columnBindings(),
      ...partIIBindings(),
      ...partIIIBindings(),
    },
    // The SSN widgets (text, maxLength 11) keep the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.line.1_row1_col_f": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.line.1_row2_col_f": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
      "0.line.1_row3_col_f": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
