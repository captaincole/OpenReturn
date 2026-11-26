/*
 * Schedule 1 line 8a: the deduction for NOLs carried from earlier years.
 * "Enter any deduction for an NOL from an earlier year ... as a negative
 * number" (irs-1040-inst-2025::sec::line-8a::b01); "list your NOL deduction as
 * a negative figure on Schedule 1" (irs-172-inst-2025::sec::deducting-a-carryforward::b01).
 * The engine keeps the amount positive, as the other subtractions on the
 * line, and line 9 subtracts it. The carryovers are a stated fact
 * (facts/kinds/netOperatingLoss.ts).
 */

import { numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import { carryoverTotals, nolDeduction, type CarryoverTotals } from "../172/carryforward.js";
import type { Form172FilingInfo } from "../172/filingInfo.js";
import type { Schedule1FilingInfo } from "./filingInfo.js";

type Read = Record<string, unknown>;
/* What line 8a reads; Form 172 line 23 reads it too. */
export type Info = Schedule1FilingInfo &
  Pick<Form172FilingInfo, "nolCarryovers" | "nolCarryoverGap"> &
  Pick<Form1040FilingInfo, "socialSecurityBenefits" | "useItemizedDeductions">;

export const AGI_ITEMS_GAP =
  "An NOL from 2018 on is limited to 80% of taxable income figured without the NOL deduction; this return has items figured from AGI (itemized deductions, taxable social security, an IRA or student loan interest deduction, Schedule 1-A, Form 8582, 8815 or 8839), and refiguring them without the NOL deduction is not modeled (QUESTIONS.md).";

/* Forms whose amounts are figured from AGI or modified AGI that includes line 8a. */
const AGI_FORMS = ["schedule-1-a", "form-8582", "form-8815", "form-8839"] as const;

/* Form 1040 income lines 1z to 7a (irs-1040-inst-2025): none of them reads line 8a when no AGI_FORMS file. */
const FORM_1040_INCOME = ["1z", "2b", "3b", "4b", "5b", "6b", "7a"].map(
  (line) => `form-1040.line.${line}`,
);
/* Schedule 1 lines 1 to 7 and 8b to 8z, as line 10 adds them; 8d and 8s subtract. */
const OTHER_INCOME = ["1", "2a", "3", "4", "5", "6", "7"].map((line) => `0.line.${line}`);
const LINE_8_ADDED = "bcefghijklmnopqrtuvz".split("").map((letter) => `0.line.8${letter}`);
const LINE_8_SUBTRACTED = ["0.line.8d", "0.line.8s"];
/* Part II adjustments without lines 20 and 21, which are 0 when the gate passes (Schedule 1 line 26). */
const ADJUSTMENTS = ["11", "12", "13", "14", "15", "16", "17", "18", "19a", "23", "25"].map(
  (line) => `1.line.${line}`,
);

/* Why the 80% limit cannot be figured on this return, else undefined. */
function agiItemsGap(info: Info): Unsupported | undefined {
  const figuredFromAgi = [
    info.useItemizedDeductions === true,
    (info.socialSecurityBenefits ?? 0) > 0,
    (info.iraContributions ?? 0) > 0,
    (info.studentLoanInterestPaid ?? 0) > 0,
    AGI_FORMS.some((formId) => info.mustFile?.[formId]?.value === true),
  ];
  return figuredFromAgi.includes(true) ? unsupported(AGI_ITEMS_GAP) : undefined;
}

/*
 * Taxable income before the NOL and QBI deductions: Form 1040 lines 1z to
 * 7a, Schedule 1 line 10 without line 8a, less the adjustments and Form 1040
 * line 12e. Undefined while a line waits.
 */
function taxableIncomeBeforeNol(form: Read): number | undefined {
  const deduction = numberOrBlank(form["form-1040.line.12e"]);
  if (deduction === undefined) return undefined;
  const income =
    sum(...FORM_1040_INCOME.map((id) => form[id])) +
    sum(...OTHER_INCOME.map((id) => form[id])) +
    sum(...LINE_8_ADDED.map((id) => form[id])) -
    sum(...LINE_8_SUBTRACTED.map((id) => form[id]));
  return income - sum(...ADJUSTMENTS.map((id) => form[id])) - deduction;
}

/* The rows split by the 2018 line; undefined with no carryover stated. */
function totalsOf(info: Info): CarryoverTotals | Unsupported | undefined {
  if (info.nolCarryoverGap) return unsupported(info.nolCarryoverGap);
  const rows = info.nolCarryovers;
  if (rows === undefined || rows.length === 0) return undefined;
  const totals = carryoverTotals(rows);
  return typeof totals === "string" ? unsupported(totals) : totals;
}

/*
 * Line 8a. Blank with no carryover. The losses before 2018 need no other line;
 * a loss from 2018 on needs taxable income before the NOL deduction, which the
 * engine figures only on a return with no item figured from AGI.
 */
export function line8a(form: Read, info: Info): number | Unsupported | undefined {
  const totals = totalsOf(info);
  if (totals === undefined || "unsupported" in totals) return totals;
  if (totals.from2018 === 0) return totals.before2018 > 0 ? totals.before2018 : undefined;
  const gap = agiItemsGap(info);
  if (gap) return gap;
  const taxableIncome = taxableIncomeBeforeNol(form);
  if (taxableIncome === undefined) return undefined;
  const deduction = nolDeduction(totals, taxableIncome);
  return deduction > 0 ? deduction : 0;
}

/*
 * Lines 9 and 10 read line 8a, and so does Form 172 line 23: with a carryover
 * stated, while line 8a waits they wait, and while it is a gap they show it.
 * Undefined when line 8a is settled or no carryover is stated. line8aValue is
 * line 8a as the reader's accessor gives it.
 */
export function line8aHold(line8aValue: unknown, info: Info): Unsupported | "waiting" | undefined {
  const totals = totalsOf(info);
  if (totals === undefined || "unsupported" in totals) return totals;
  const gap = totals.from2018 > 0 ? agiItemsGap(info) : undefined;
  if (gap) return gap;
  // Line 8a prints an amount whenever a row holds one; until then the readers wait.
  const expectsAmount = totals.before2018 > 0 || totals.from2018 > 0;
  return expectsAmount && typeof line8aValue !== "number" ? "waiting" : undefined;
}
