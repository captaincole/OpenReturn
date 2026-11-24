/*
 * MANUAL EDIT: the Form 8960 lines for a PFIC (Form 8621). With no fund fact
 * each line keeps the reason it had before Form 8621 had rules.
 */

import type { FormAccessor } from "../../defineForm.js";
import { unsupported, type Unsupported } from "../../types.js";
import type { Form8960FilingInfo } from "./filingInfo.js";
import type { Form8960 } from "./types.js";

const NO_ELECTION = "No CFC/QEF (PFIC) scenario yet; Reg. 1.1411-10(g) election not modeled.";
const LINE_5B =
  "Gains/losses excluded from NII (non-section 1411 trade or business, NUA, capital loss carryforward adjustments) — no scenario or facts modeled yet.";
const LINE_6 = "CFC/PFIC adjustments — no CFC/PFIC ownership scenario yet.";

/* The box above Part I: a section 1.1411-10(g) election in effect for a QEF. */
function election1411g(_: unknown, info: Form8960FilingInfo): true | Unsupported | undefined {
  const totals = info.form8621Totals;
  if (totals === undefined) return unsupported(NO_ELECTION);
  return totals.section1411gElection ? true : undefined;
}

const isNonZero = (value: unknown) => typeof value === "number" && value !== 0;
const isAboveZero = (value: unknown) => typeof value === "number" && value > 0;

/*
 * Signs of the line 5b items the engine does not figure (the Lines 5a–5d
 * worksheet, irs-8960-inst-2025::sec::line-5b-net-gain-or-loss-from-disposition-of::b05–b07):
 * a trade or business on Schedule 1 lines 3, 5 or 6 (worksheet lines 2(a) to
 * 2(d)), a pension or annuity that may hold employer securities (2(e), NUA),
 * and a capital loss carried in or out (2(h) and 2(i)).
 */
function otherLine5bItems(form: FormAccessor<Form8960>): boolean {
  const business = ["schedule-1.0.line.3", "schedule-1.0.line.5", "schedule-1.0.line.6"].some(
    (fieldId) => isNonZero(form[fieldId]),
  );
  const carryIn = [
    "schedule-d.0.line.6_short_term_loss_carryover",
    "schedule-d.0.line.14_long_term_loss_carryover",
  ].some((fieldId) => isAboveZero(form[fieldId]));
  const carryOut =
    typeof form["schedule-d.1.line.16_combined_gain_loss"] === "number" &&
    (form["schedule-d.1.line.16_combined_gain_loss"] as number) < 0;
  return business || carryIn || carryOut || isAboveZero(form["form-1040.line.5a"]);
}

/*
 * Line 5b: "Use line 5b to deduct inclusions under section 1293(a)(1)(B) that
 * are allowed on line 5a" (irs-8960-inst-2025::sec::line-6-adjustments-to-investment-income-for::b05):
 * a QEF's line 7c without a section 1.1411-10(g) election (worksheet line 2(f)),
 * which is in line 5a through Schedule D. With the election the gain stays on
 * line 5a, and 2(f) is 0. The worksheet's other items are not figured: on a
 * return with a fund fact the line is the 2(f) amount (blank when 0), unless
 * the return shows a sign of another item (otherLine5bItems).
 */
function line5b(
  form: FormAccessor<Form8960>,
  info: Form8960FilingInfo,
): number | Unsupported | undefined {
  const totals = info.form8621Totals;
  if (totals === undefined) return unsupported(LINE_5B);
  if (totals.gap !== undefined) return unsupported(totals.gap);
  if (otherLine5bItems(form)) return unsupported(LINE_5B);
  const excluded = totals.amounts.netInvestmentIncomeGainExcluded;
  return excluded > 0 ? -excluded : undefined;
}

/*
 * Line 6 (::b02–b03): a section 1296 inclusion or deduction, every excess
 * distribution and gain of a section 1291 fund, and a QEF's line 6c with a
 * section 1.1411-10(g) election: PFIC income no other Form 8960 line holds.
 */
function line6(_: unknown, info: Form8960FilingInfo): number | Unsupported | undefined {
  const totals = info.form8621Totals;
  if (totals === undefined) return unsupported(LINE_6);
  if (totals.gap !== undefined) return unsupported(totals.gap);
  const addition = totals.amounts.netInvestmentIncomeAddition;
  return addition === 0 ? undefined : addition;
}

export const pficBindings = {
  "0.header.election_1411_10g": election1411g,
  "0.line.5b": line5b,
  "0.line.6": line6,
};
