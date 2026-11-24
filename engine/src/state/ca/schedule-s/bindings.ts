/* Schedule S rules, written by hand from ca-540-sched-s-inst-2025 (no answer key: QUESTIONS.md). */

import { defineForm, type BindingFn, type FormAccessor } from "../../../defineForm.js";
import { namesOnReturn } from "../../../federal/returnNames.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { OtherStateCreditInput, ScheduleSFilingInfo } from "./filingInfo.js";
import { PART_I_ROWS, partIRows, ratioText, type PartIRow, type ScheduleSLines } from "./lines.js";
import { copyLines } from "./returnAmounts.js";
import type { ScheduleS } from "./types.js";

type Bindings = Partial<{ [K in keyof ScheduleS]: BindingFn<ScheduleS, ScheduleSFilingInfo, K> }>;
type Form = FormAccessor<ScheduleS>;

const PART_I_OVERFLOW = unsupported(
  "Part I has three rows and the instructions give no continuation statement; a fourth income item is not printed (line 1 still adds every item).",
);

/* The copy being evaluated: one other state. Undefined with no stated state (an explicit decision alone). */
const copyInput = (info: ScheduleSFilingInfo): OtherStateCreditInput | undefined =>
  info.otherStateCredits?.[info.scheduleSCopyIndex ?? 0];

function linesOf(form: Form, info: ScheduleSFilingInfo): ScheduleSLines | Unsupported | undefined {
  const input = copyInput(info);
  if (input === undefined) return undefined;
  return copyLines((fieldId) => form[fieldId], info, input);
}

/* A Part II line from the copy's lines; an unsupported line 2 or 4 carries through. */
const fromLines =
  <T>(pick: (lines: ScheduleSLines) => T) =>
  (form: Form, info: ScheduleSFilingInfo): T | Unsupported | undefined => {
    const lines = linesOf(form, info);
    if (lines === undefined || "unsupported" in lines) return lines;
    return pick(lines);
  };

/*
 * Part I row `index` (0 to 2), from the stated items alone: "In column (a),
 * identify the income item ... In column (b), enter the amount of income from
 * that item taxed by California. In column (c), enter the amount of income from
 * that item taxed by the other state"
 * (ca-540-sched-s-inst-2025::sec::part-i-double-taxed-income::b01).
 */
const fromRow =
  <T>(index: number, pick: (row: PartIRow) => T) =>
  (_: Form, info: ScheduleSFilingInfo): T | Unsupported | undefined => {
    const items = copyInput(info)?.items;
    if (items === undefined) return undefined;
    if (index === PART_I_ROWS - 1 && items.length > PART_I_ROWS) return PART_I_OVERFLOW;
    const row = partIRows(items)[index];
    return row === undefined ? undefined : pick(row);
  };

function partIBindings(): Bindings {
  const bindings: Record<string, BindingFn<ScheduleS, ScheduleSFilingInfo, keyof ScheduleS>> = {};
  for (let index = 0; index < PART_I_ROWS; index++) {
    const prefix = `0.part1.row${index + 1}`;
    bindings[`${prefix}_income_item_description_col_a`] = fromRow(index, (row) => row.description);
    bindings[`${prefix}_taxable_by_california_col_b`] = fromRow(
      index,
      (row) => row.californiaAmount,
    );
    bindings[`${prefix}_taxable_by_other_state_col_c`] = fromRow(
      index,
      (row) => row.otherStateAmount,
    );
  }
  return bindings as Bindings;
}

export function scheduleSBindings(): Bindings {
  return {
    "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
    "0.header.ssn": (_, info) => info.taxpayerSSN,
    ...partIBindings(),
    "0.line.1_total_double_taxed_income_col_b": fromLines((lines) => lines.line1California),
    "0.line.1_total_double_taxed_income_col_c": fromLines((lines) => lines.line1OtherState),
    "0.line.2_california_tax_liability": fromLines((lines) => lines.line2),
    "0.line.3_double_taxed_income_california": fromLines((lines) => lines.line3),
    "0.line.4_california_adjusted_gross_income": fromLines((lines) => lines.line4),
    "0.line.5_california_income_ratio": fromLines((lines) => ratioText(lines.line5)),
    "0.line.6_california_tax_on_double_taxed_income": fromLines((lines) => lines.line6),
    // Line 7: "use state's abbreviation" (the form).
    "0.line.7_other_state_abbreviation": (_, info) => copyInput(info)?.state,
    "0.line.7_tax_paid_to_other_state": fromLines((lines) => lines.line7),
    "0.line.8_double_taxed_income_other_state": fromLines((lines) => lines.line8),
    "0.line.9_other_state_adjusted_gross_income": fromLines((lines) => lines.line9),
    "0.line.10_other_state_income_ratio": fromLines((lines) => ratioText(lines.line10)),
    "0.line.11_other_state_tax_on_double_taxed_income": fromLines((lines) => lines.line11),
    "0.line.12_other_state_tax_credit": fromLines((lines) => lines.line12),
  };
}

export function register(): void {
  defineForm<ScheduleS, ScheduleSFilingInfo>("schedule-s", { bindings: scheduleSBindings() });
}
