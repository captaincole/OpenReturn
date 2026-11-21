/*
 * FTB 3506 Part III lines 3 to 12 (the credit) and the Worksheet – Credit for
 * 2024 Expenses Paid in 2025, which fills line 11.
 */

import type { BindingFn } from "../../../defineForm.js";
import { earnedIncome } from "../../../federal/2441/lines.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3506FilingInfo } from "./filingInfo.js";
import {
  NONRESIDENT_EARNED_INCOME,
  NO_PROVIDER,
  columnE,
  creditClaimed,
  federalAgi,
  filesNonresidentReturn,
  filledLines,
  hasProvider,
  receivedBenefits,
  type Form,
} from "./gates.js";
import * as line from "./lines.js";
import type { Form3506 } from "./types.js";

type Bindings = Partial<{ [K in keyof Form3506]: BindingFn<Form3506, Form3506FilingInfo, K> }>;
type WorksheetKey = Exclude<keyof line.WorksheetLines, "credit">;

/*
 * With Part IV, line 30 zero or less stops the credit ("Exception – If you
 * paid 2024 expenses in 2025, see instructions for line 11"). Undefined while line 30 waits.
 */
function stoppedAtLine30(form: Form, info: Form3506FilingInfo): boolean | undefined {
  if (!receivedBenefits(info)) return false;
  const line30 = numberOrBlank(form["1.line.30_limit_minus_benefits"]);
  return line30 === undefined ? undefined : line30 <= 0;
}

/* Lines 3 to 10: the credit applies, line 1 lists a provider, and line 30 did not stop it. */
function creditLine<T>(form: Form, info: Form3506FilingInfo, value: () => T): T | undefined {
  if (creditClaimed(info) !== true || !hasProvider(info)) return undefined;
  return stoppedAtLine30(form, info) === false ? value() : undefined;
}

/* Lines 4 and 5: Form 2441's earned income (ca-3506-inst-2025::sec::line-4::b01 lists the same items). */
function earnedIncomeLine(
  form: Form,
  info: Form3506FilingInfo,
  whose: "yours" | "spouse",
): number | Unsupported | undefined {
  if (filesNonresidentReturn(info)) return unsupported(NONRESIDENT_EARNED_INCOME);
  const income = earnedIncome(form, info);
  if (income === undefined || "unsupported" in income) return income;
  return income[whose];
}

/* Line 3: with Part IV, line 33; else column (e) up to the dollar limit. */
function line3(form: Form, info: Form3506FilingInfo): number | undefined {
  if (receivedBenefits(info)) return numberOrBlank(form["1.line.33_smallest_of_line_30_31_32"]);
  const amounts = columnE(info);
  return amounts === undefined ? undefined : line.line3(amounts);
}

/* Federal AGI when it is $100,000 or less; undefined over it ("Stop") or while it waits. */
function agiWithinLimit(form: Form): number | undefined {
  const agi = federalAgi(form);
  return agi !== undefined && agi <= line.FEDERAL_AGI_LIMIT ? agi : undefined;
}

/*
 * The worksheet (ca-3506-inst-2025::sec::line-11::b01): only with 2024
 * expenses for care in California paid in 2025. Undefined while an answer waits.
 */
function worksheetOf(form: Form, info: Form3506FilingInfo): line.WorksheetLines | undefined {
  if (creditClaimed(info) !== true || !hasProvider(info)) return undefined;
  if (agiWithinLimit(form) === undefined) return undefined;
  const paid = info.caPriorYearExpensesPaid;
  const answers = info.caPriorYearWorksheet;
  if (paid === undefined || paid <= 0 || answers === undefined) return undefined;
  return line.figureWorksheet(answers, paid, info.filingStatus === "married_filing_jointly");
}

/* Line 11: the worksheet's line 15, or 0 with no 2024 expenses paid in 2025. */
function line11(form: Form, info: Form3506FilingInfo): number | undefined {
  if (creditClaimed(info) !== true || !hasProvider(info)) return undefined;
  if (agiWithinLimit(form) === undefined) return undefined;
  if (info.caPriorYearExpensesPaid === 0) return 0;
  return worksheetOf(form, info)?.credit;
}

/*
 * Line 12: lines 10 and 11. No credit claimed, or federal AGI over $100,000
 * (line 9, "Stop"), is 0; stopped at line 30, line 11 alone. Undefined while
 * a line waits, so Form 540 waits too.
 */
function line12(form: Form, info: Form3506FilingInfo): number | Unsupported | undefined {
  const claimed = creditClaimed(info);
  if (claimed !== true) return claimed === false ? 0 : undefined;
  if (!hasProvider(info)) return unsupported(NO_PROVIDER);
  const agi = federalAgi(form);
  if (agi === undefined) return undefined;
  if (agi > line.FEDERAL_AGI_LIMIT) return 0;
  const prior = numberOrBlank(form["0.line.11_prior_year_expenses_credit"]);
  const stopped = stoppedAtLine30(form, info);
  if (prior === undefined || stopped === undefined) return undefined;
  if (stopped) return prior;
  const line10 = numberOrBlank(form["0.line.10_line_8_times_line_9"]);
  return line10 === undefined ? undefined : line10 + prior;
}

function creditBindings(): Bindings {
  return {
    "0.line.3_total_qualified_expenses": (form, info) =>
      creditLine(form, info, () => line3(form, info)),
    "0.line.4_your_earned_income": (form, info) =>
      creditLine(form, info, () => earnedIncomeLine(form, info, "yours")),
    "0.line.5_spouse_rdp_earned_income": (form, info) =>
      creditLine(form, info, () => earnedIncomeLine(form, info, "spouse")),
    "0.line.6_smallest_of_lines_3_4_5": (form) => {
      const lines = filledLines(
        form["0.line.3_total_qualified_expenses"],
        form["0.line.4_your_earned_income"],
        form["0.line.5_spouse_rdp_earned_income"],
      );
      return lines === undefined ? undefined : line.line6(lines[0], lines[1], lines[2]);
    },
    // The widget takes the two digits after the printed decimal point.
    "0.line.7_federal_credit_decimal_amount": (form, info) =>
      creditLine(form, info, () => {
        const agi = federalAgi(form);
        return agi === undefined ? undefined : String(line.federalPercent(agi));
      }),
    "0.line.8_line_6_times_line_7": (form) => {
      const line6 = numberOrBlank(form["0.line.6_smallest_of_lines_3_4_5"]);
      const agi = federalAgi(form);
      return line6 === undefined || agi === undefined ? undefined : line.line8(line6, agi);
    },
    "0.line.9_california_credit_decimal_amount": (form, info) =>
      creditLine(form, info, () => {
        const agi = agiWithinLimit(form);
        return agi === undefined ? undefined : String(line.californiaPercent(agi));
      }),
    "0.line.10_line_8_times_line_9": (form) => {
      const line8 = numberOrBlank(form["0.line.8_line_6_times_line_7"]);
      const agi = agiWithinLimit(form);
      return line8 === undefined || agi === undefined ? undefined : line.line10(line8, agi);
    },
    "0.line.11_prior_year_expenses_credit": (form, info) => line11(form, info),
    "0.line.12_child_dependent_care_credit": (form, info) => line12(form, info),
  };
}

const WORKSHEET_FIELDS: Array<[keyof Form3506, WorksheetKey]> = [
  ["1.worksheet.1_prior_year_expenses_paid_prior_year", "line1"],
  ["1.worksheet.2_prior_year_expenses_paid_this_year", "line2"],
  ["1.worksheet.3_total_prior_year_expenses", "line3"],
  ["1.worksheet.4_prior_year_expense_limit", "line4"],
  ["1.worksheet.5_prior_year_excluded_benefits", "line5"],
  ["1.worksheet.6_limit_minus_excluded_benefits", "line6"],
  ["1.worksheet.7_smaller_prior_year_earned_income", "line7"],
  ["1.worksheet.8_smallest_of_line_3_6_7", "line8"],
  ["1.worksheet.9_prior_year_form_line_6", "line9"],
  ["1.worksheet.10_line_8_minus_line_9", "line10"],
  ["1.worksheet.11_prior_year_federal_agi", "line11"],
  ["1.worksheet.12_prior_year_federal_agi_decimal", "line12"],
  ["1.worksheet.13_line_10_times_line_12", "line13"],
  ["1.worksheet.14_prior_year_california_agi_decimal", "line14"],
  ["1.worksheet.15_prior_year_expenses_credit", "line15"],
];

/* Worksheet lines 12 and 14 print the decimal's two digits. */
const DECIMAL_LINES = new Set<WorksheetKey>(["line12", "line14"]);

function worksheetBindings(): Bindings {
  const bindings: Record<string, (form: Form, info: Form3506FilingInfo) => unknown> = {};
  for (const [fieldId, key] of WORKSHEET_FIELDS) {
    bindings[fieldId] = (form, info) => {
      const value = worksheetOf(form, info)?.[key];
      if (value === undefined) return undefined;
      return DECIMAL_LINES.has(key) ? String(value) : value;
    };
  }
  return bindings as Bindings;
}

export function partIIIBindings(): Bindings {
  return { ...creditBindings(), ...worksheetBindings() };
}
