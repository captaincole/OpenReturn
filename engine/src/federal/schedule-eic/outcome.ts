/*
 * Form 1040 line 27a's outcome from the return's lines, for every form that
 * needs it: line 27a and 27c, and Schedule 8812 line 24, which must tell "no
 * EIC" (line 27a blank, counts as 0) from "EIC still waiting". Lines are read
 * by full field id, so any form's accessor works.
 */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";
import { earnedIncomeCredit, type EicOutcome } from "./credit.js";
import { worksheet1 } from "./worksheet1.js";

type Lines = FormAccessor<object>;

export const COMBAT_PAY_ELECTION_GAP =
  "Nontaxable combat pay (W-2 box 12 code Q) counts in EIC earned income only by election, and no fact records the election.";
export const STATUTORY_EMPLOYEE_GAP =
  "Worksheet B Part 3 for a statutory employee (W-2 box 13) is not modeled.";

/** The slots the outcome reads; Form 1040's and Schedule 8812's filing info both have them. */
export type EicOutcomeInfo = Pick<
  Form1040FilingInfo,
  | "mustFile"
  | "filingStatus"
  | "taxpayerSSN"
  | "spouseSSN"
  | "taxpayerDateOfBirth"
  | "spouseDateOfBirth"
  | "earnedIncomeCredit"
  | "w2NontaxableCombatPay"
  | "scheduleCNetProfit"
  | "rentalProperties"
>;

/*
 * Step 5 line 5 (irs-1040-inst-2025::sec::step-5::b01): line 1z, less Medicaid
 * waiver payments (Schedule 1 line 8s has no fact kind), plus nontaxable combat
 * pay if elected. No fact holds the election, so a W-2 with code Q is a gap;
 * line 1z, the amount without the election, is the least it can be.
 * Clergy and church employee wages (Schedule SE line 5a) are not modeled.
 */
function step5EarnedIncome(form: Lines, info: EicOutcomeInfo): number | undefined {
  if (info.w2NontaxableCombatPay !== undefined) return undefined;
  return numberOrBlank(form["form-1040.line.1z"]);
}

/*
 * Worksheet B line 4b (irs-1040-inst-2025::sec::bworksheet-2025-eic-line-27a::b01
 * to ::b03). Part 1 for a Schedule SE filer: SE line 3, plus lines 4b and 5a,
 * less line 13. Part 2 for a business that files no Schedule SE: Schedule C
 * line 31. Farm income, Schedule K-1 box 14 and statutory employees (Part 3)
 * are not modeled, so a statutory employee is a gap.
 */
function worksheetBEarnedIncome(
  form: Lines,
  info: EicOutcomeInfo,
  line4a: number | undefined,
): number | undefined {
  const seFiles = info.mustFile?.["schedule-se"]?.value;
  if (seFiles === undefined || line4a === undefined) return undefined;
  if (info.earnedIncomeCredit?.statutoryEmployee !== false) return undefined;
  if (!seFiles) {
    return info.scheduleCNetProfit === undefined
      ? undefined
      : roundDollars(info.scheduleCNetProfit) + line4a;
  }
  const line1a = numberOrBlank(form["schedule-se.0.line.3"]);
  const line1d = numberOrBlank(form["schedule-se.0.line.13"]);
  if (line1a === undefined || line1d === undefined) return undefined;
  const line1c = sum(line1a, form["schedule-se.0.line.4b"], form["schedule-se.0.line.5a"]);
  return line1c - line1d + line4a;
}

/* Why earned income cannot be figured: the combat pay election, or Worksheet B Part 3. */
function earnedIncomeGap(info: EicOutcomeInfo, worksheetB: boolean): string | undefined {
  if (info.w2NontaxableCombatPay !== undefined) return COMBAT_PAY_ELECTION_GAP;
  if (worksheetB && info.earnedIncomeCredit?.statutoryEmployee === true) {
    return STATUTORY_EMPLOYEE_GAP;
  }
  return undefined;
}

/*
 * Line 27a's steps (irs-1040-inst-2025, lines 27a–27c). Step 2, question 4: a
 * Schedule E sends the filer to Pub. 596 Worksheet 1. Step 5, question 2: a
 * business, or a Schedule SE whose filing is still open, sends the filer to
 * Worksheet B.
 */
export function eicOutcome(form: Lines, info: EicOutcomeInfo): EicOutcome {
  const answers = info.earnedIncomeCredit;
  if (answers === undefined) return { kind: "waiting" };
  const worksheetB = answers.selfEmployed || info.mustFile?.["schedule-se"]?.value !== false;
  const earned = (step5: number | undefined) =>
    worksheetB ? worksheetBEarnedIncome(form, info, step5) : step5;
  const lowestStep5 = numberOrBlank(form["form-1040.line.1z"]);
  // Step 2: "If line 7a is a loss, enter -0-."
  const investmentIncome = sum(
    form["form-1040.line.2a"],
    form["form-1040.line.2b"],
    form["form-1040.line.3b"],
    atLeast(0, form["form-1040.line.7a"]),
  );
  return earnedIncomeCredit(
    {
      filingStatus: info.filingStatus,
      agi: numberOrBlank(form["form-1040.line.11b"]),
      investmentIncome,
      worksheet1: worksheet1(form, info, investmentIncome),
      earnedIncome: earned(step5EarnedIncome(form, info)),
      earnedIncomeAtLeast: earned(lowestStep5),
      earnedIncomeGap: earnedIncomeGap(info, worksheetB),
      worksheetB,
      taxpayerSsn: info.taxpayerSSN,
      spouseSsn: info.spouseSSN,
      taxpayerDob: info.taxpayerDateOfBirth,
      spouseDob: info.spouseDateOfBirth,
    },
    answers,
  );
}
