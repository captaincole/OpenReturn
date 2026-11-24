/*
 * MANUAL EDIT: the Form 8960 lines for a PFIC (Form 8621). With no fund fact
 * each line keeps the reason it had before Form 8621 had rules.
 */

import { unsupported, type Unsupported } from "../../types.js";
import type { Form8960FilingInfo } from "./filingInfo.js";

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

/*
 * Line 5b: "Use line 5b to deduct inclusions under section 1293(a)(1)(B) that
 * are allowed on line 5a" (irs-8960-inst-2025::sec::line-6-adjustments-to-investment-income-for::b05):
 * a QEF's line 7c without a section 1.1411-10(g) election, which is in line 5a
 * through Schedule D. Its other items are not modeled, so with no such gain the
 * line keeps its reason.
 */
function line5b(_: unknown, info: Form8960FilingInfo): number | Unsupported {
  const totals = info.form8621Totals;
  if (totals?.gap !== undefined) return unsupported(totals.gap);
  const excluded = totals?.amounts.netInvestmentIncomeGainExcluded ?? 0;
  return excluded > 0 ? -excluded : unsupported(LINE_5B);
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
