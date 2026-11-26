/* FTB 3805V rules, written by hand from ca-3805v-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { formatDollars } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { isUnsupportedResult } from "../3801/context.js";
import { carryoverDeductions, type Info, type Read } from "./figures.js";
import type { SectionALines } from "./lines.js";
import { CURRENT_ROWS, GENERAL, PRIOR_ROWS, type CarryoverRowLines } from "./partIII.js";
import { currentDisasterOf, currentNolOf, partIILinesOf, totalsOf } from "./partsReads.js";
import { sectionALinesOf } from "./sectionAReads.js";
import type { Form3805V } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3805V]: BindingFn<Form3805V, Info, K> }>;
type Binding = (form: Read, info: Info) => unknown;
type Gapped<T> = T | Unsupported | undefined;

const MORE_ROWS_GAP =
  "More than four prior year carryovers: Part III line 2 has four rows and the instructions name no attached statement, so the fourth row is not printed.";
const SOURCE_CODE_GAP =
  "The current year NOL includes a loss from a K-1 or a farm: column (b) takes the entity's FEIN or number, or the farm's activity code (ca-3805v-inst-2025::sec::part-iii-limitations::b03), and the engine does not split the NOL by source.";

/* `pick` of a figured value; its gap, or blank while it waits. */
function from<T>(figure: (form: Read, info: Info) => Gapped<T>, pick: (value: T) => unknown) {
  return (form: Read, info: Info) => {
    const value = figure(form, info);
    return value === undefined || isUnsupportedResult(value) ? value : pick(value);
  };
}

/* Part I Section A, line by line (lines.ts, sectionAReads.ts). */
const SECTION_A_FIELDS: Array<[string, keyof SectionALines]> = [
  ["0.part1.1_adjusted_gross_income", "line1"],
  ["0.part1.2_itemized_or_standard_deduction", "line2"],
  ["0.part1.3a_agi_less_deductions", "line3a"],
  ["0.part1.3b_declared_disaster_loss", "line3b"],
  ["0.part1.3c_loss_without_disaster_loss", "line3c"],
  ["0.part1.4_nonbusiness_capital_losses", "line4"],
  ["0.part1.5_nonbusiness_capital_gains", "line5"],
  ["0.part1.6_nonbusiness_capital_loss_excess", "line6"],
  ["0.part1.7_nonbusiness_capital_gain_excess", "line7"],
  ["0.part1.8_nonbusiness_deductions", "line8"],
  ["0.part1.9_nonbusiness_income_other", "line9"],
  ["0.part1.10_nonbusiness_income_total", "line10"],
  ["0.part1.11_nonbusiness_deductions_excess", "line11"],
  ["0.part1.12_nonbusiness_income_excess", "line12"],
  ["0.part1.13_business_capital_losses", "line13"],
  ["0.part1.14_business_capital_gains", "line14"],
  ["0.part1.15_income_against_business_losses", "line15"],
  ["0.part1.16_business_capital_loss_excess", "line16"],
  ["0.part1.17_capital_loss_excess_total", "line17"],
  ["0.part1.18_schedule_d_line_8_loss", "line18"],
  ["0.part1.19_schedule_d_line_9_loss", "line19"],
  ["0.part1.20_line_18_over_line_19", "line20"],
  ["0.part1.21_line_19_over_line_18", "line21"],
  ["0.part1.22_capital_loss_adjustment", "line22"],
  ["0.part1.23_prior_year_nol_carryovers", "line23"],
  ["0.part1.24_total_adjustments", "line24"],
  ["0.part1.25_current_year_nol", "line25"],
];

/* Section B's lines; every column (a) to (e) of each. */
const SECTION_B_LINES = [
  "1_adjusted_gross_income",
  "2_itemized_or_standard_deduction",
  "3a_combine_lines_1_and_2",
  "3b_declared_disaster_loss",
  "3c_combine_lines_3a_and_3b",
  "4_nonbusiness_capital_losses",
  "5_nonbusiness_capital_gains",
  "6_nonbusiness_capital_loss_excess",
  "7_nonbusiness_capital_gain_excess",
  "8_nonbusiness_deductions",
  "9_nonbusiness_income_other",
  "10_add_lines_7_and_9",
  "11_nonbusiness_deductions_excess",
  "12_nonbusiness_income_excess",
  "13_business_capital_losses",
  "14_business_capital_gains",
  "15_add_lines_12_and_14",
  "16_business_capital_loss_excess",
  "17_add_lines_6_and_16",
  "18_schedule_d_line_4_loss",
  "19_schedule_d_line_5_loss",
  "20_line_18_over_line_19",
  "21_line_19_over_line_18",
  "22_capital_loss_adjustment",
  "23_nol_disaster_loss_carryovers",
  "24_add_lines_11_21_22_23",
  "25_current_year_nol",
];
const SECTION_B_COLUMNS = ["a", "b", "c", "d", "e"];

function partIBindings(): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (const [fieldId, line] of SECTION_A_FIELDS) {
    bindings[fieldId] = from(sectionALinesOf, (lines) => lines[line]);
  }
  // Section B: "Nonresidents and Part-Year Residents Only"; blank on Form 540, the gap on Form 540NR.
  for (const line of SECTION_B_LINES) {
    for (const column of SECTION_B_COLUMNS) {
      bindings[`1.part1_section_b.${line}_col_${column}`] = (_, info) =>
        info.form3805v?.gap ? unsupported(info.form3805v.gap) : undefined;
    }
  }
  return bindings;
}

const PART_II_FIELDS = [
  "2.part2.1_taxable_income",
  "2.part2.2_capital_loss_deduction",
  "2.part2.3_disaster_loss_carryover",
  "2.part2.4_nol_carryover",
  "2.part2.5_itemized_deduction_adjustments",
  "2.part2.6_modified_taxable_income",
] as const;

/* A prior year row's columns (::part-iii-limitations::b02, b03; ::declared-disasters::b16, b17). */
const PRIOR_COLUMNS: Array<[string, (row: CarryoverRowLines) => unknown]> = [
  ["a", (row) => String(row.yearOfLoss)],
  ["b", (row) => row.code],
  ["c", (row) => row.type],
  ["d", (row) => row.initialLoss],
  ["e", (row) => row.carryover],
  ["f", (row) => row.used],
  ["g", (row) => row.balance],
  ["h", (row) => row.carryForward],
];

function partIIIPriorBindings(): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  bindings["2.part3.1_mti_available_balance_col_g"] = from(carryoverDeductions, (lines) =>
    lines.rows.length > 0 ? lines.line1 : undefined,
  );
  for (let index = 0; index < PRIOR_ROWS; index++) {
    for (const [column, pick] of PRIOR_COLUMNS) {
      bindings[`2.part3.2_row${index + 1}_col_${column}`] = from(carryoverDeductions, (lines) => {
        if (index === PRIOR_ROWS - 1 && lines.rows.length > PRIOR_ROWS)
          return unsupported(MORE_ROWS_GAP);
        const row = lines.rows[index];
        return row === undefined ? undefined : pick(row);
      });
    }
  }
  return bindings;
}

/* Line 3, the 2025 disaster loss: blank with none, else its gap. */
const disasterRow = (form: Read, info: Info) => {
  const disaster = currentDisasterOf(form, info);
  return isUnsupportedResult(disaster) ? disaster : undefined;
};

/*
 * Line 4: the current year NOL on one row as a general NOL (QUESTIONS.md);
 * column (h) is column (d), since line 4 uses nothing in 2025.
 */
function currentNolColumn(pick: (nol: number, info: Info) => unknown): Binding {
  return (form, info) => {
    const nol = currentNolOf(form, info);
    if (nol === undefined || isUnsupportedResult(nol)) return nol;
    return nol > 0 ? pick(nol, info) : undefined;
  };
}

function partIIICurrentBindings(): Record<string, Binding> {
  const bindings: Record<string, Binding> = {};
  for (const column of ["b", "d", "f", "h"]) {
    bindings[`2.part3.3_current_year_disaster_nol_col_${column}`] = disasterRow;
  }
  bindings["2.part3.4_row1_col_b"] = currentNolColumn((_, info) =>
    info.form3805v?.lossFromPassThrough || info.mustFile?.["schedule-f"]?.value === true
      ? unsupported(SOURCE_CODE_GAP)
      : undefined,
  );
  bindings["2.part3.4_row1_col_c"] = currentNolColumn(() => GENERAL);
  bindings["2.part3.4_row1_col_d"] = currentNolColumn((nol) => nol);
  bindings["2.part3.4_row1_col_h"] = currentNolColumn((nol) => nol);
  for (let row = 2; row <= CURRENT_ROWS; row++) {
    for (const column of ["b", "c", "d", "h"]) {
      bindings[`2.part3.4_row${row}_col_${column}`] = () => undefined;
    }
  }
  bindings["2.part3.5_nol_carryover"] = from(totalsOf, (totals) => totals.line5);
  bindings["2.part3.6_disaster_loss_carryover"] = from(totalsOf, (totals) => totals.line6);
  return bindings;
}

/* Every FTB 3805V binding; the unit tests evaluate them without the engine. */
export function form3805VBindings(): Bindings {
  const partII: Record<string, Binding> = {};
  PART_II_FIELDS.forEach((fieldId, index) => {
    const line = `line${index + 1}` as const;
    partII[fieldId] = from(partIILinesOf, (lines) => lines[line as keyof typeof lines]);
  });
  return {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    // FEIN: an estate or trust's number; the engine prepares individual returns.
    "0.header.fein": () => undefined,
    ...partIBindings(),
    ...partII,
    ...partIIIPriorBindings(),
    ...partIIICurrentBindings(),
  } as Bindings;
}

/* "If negative, use brackets" (lines 1, 3a, 3c and 25 of Section A; Part II line 1). */
const bracketed = (value: number) =>
  value < 0 ? `(${formatDollars(-value)})` : formatDollars(value);

export function register(): void {
  defineForm<Form3805V, Info>("form-3805v", {
    bindings: form3805VBindings(),
    formatters: {
      "0.part1.1_adjusted_gross_income": bracketed,
      "0.part1.3a_agi_less_deductions": bracketed,
      "0.part1.3c_loss_without_disaster_loss": bracketed,
      "0.part1.25_current_year_nol": bracketed,
      "2.part2.1_taxable_income": bracketed,
    },
    // The form comes off the return with no NOL, carryover or deduction (resolveInfo.ts).
    filesOnlyWithAmountOn: [
      "form-3805v.2.part3.5_nol_carryover",
      "form-3805v.2.part3.6_disaster_loss_carryover",
      "schedule-ca.2.line.b9b1_subtractions",
      "schedule-ca.2.line.b9b2_subtractions",
    ],
  });
}
