/*
 * MANUAL EDIT: Credit Limit Worksheet B of the Schedule 8812 instructions
 * (irs-1040s8-inst-2025::sec::credit-limit-worksheet-b-keep-for-your-records::b01–b03,
 * credit-limit-worksheet-b-continued::b01–b02). It applies with a qualifying
 * child under 17 and a Form 8396, 8839, 5695 Part I or 8859 credit
 * (irs-1040s8-inst-2025::sec::line-21::b03). Line 14 is the part of the child
 * tax credit that those credits must leave room for; Form 8396 reads it in
 * place of Form 1040 line 19. It reads no Schedule 8812 line after line 12, so
 * it makes no cycle with line 13.
 *
 * Lines 7, 8 and 10 are the same amounts as Schedule 8812 lines 21, 22 and 24:
 * both read the helpers here. Lines are read by full field id, so any form's
 * accessor works. A caller skips this worksheet when Form 2555 files
 * (irs-1040s8-inst-2025::sec::line-21::b03). Puerto Rico residence has no
 * fact: the engine reads it as absent.
 */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { eicOutcome, type EicOutcomeInfo } from "../schedule-eic/outcome.js";
import { SELF_EMPLOYED_EARNED_INCOME, selfEmployedForLine18a } from "./earnedIncomeGap.js";
import type { Schedule8812FilingInfo } from "./filingInfo.js";

type Lines = FormAccessor<object>;

export type WorksheetBInfo = EicOutcomeInfo &
  Pick<Schedule8812FilingInfo, "w2SocialSecurityTaxWithheld" | "w2MedicareTaxWithheld">;

// Line 2 and Schedule 8812 line 16b: "× $1,700" for each qualifying child.
export const ADDITIONAL_CREDIT_PER_CHILD = 1_700;
// Line 4 and line 19: "Subtract $2,500 from the amount on line 3".
export const EARNED_INCOME_FLOOR = 2_500;
// Line 5 and line 20: "Multiply the amount on line 4 by 15% (0.15)".
export const EARNED_INCOME_RATE = 0.15;
// Line 6 and line 20 Next: "is the amount $5,100 or more?"
export const PART_II_B_MINIMUM = 5_100;

/*
 * Line 3 and Schedule 8812 line 18a, the Earned Income Chart
 * (irs-1040s8-inst-2025::sec::earned-income-chart-line-18a::b01): with no
 * self-employment, Form 1040 line 1z plus all nontaxable combat pay, less
 * Medicaid waiver payments (Schedule 1 line 8s, unsupported). With a business
 * or Schedule SE the worksheets differ and are not drafted: unsupported.
 */
export function earnedIncome(form: Lines, info: WorksheetBInfo): number | Unsupported | undefined {
  if (selfEmployedForLine18a(form, info)) return unsupported(SELF_EMPLOYED_EARNED_INCOME);
  const line1z = numberOrBlank(form["form-1040.line.1z"]);
  if (line1z === undefined) return undefined;
  return atLeast(0, sum(line1z, roundDollars(info.w2NontaxableCombatPay)));
}

// Lines 4 and 5 (Schedule 8812 lines 19 and 20): 15% of earned income over $2,500; "No ... enter -0-".
export const earnedIncomeCredit15Percent = (earned: number): number =>
  earned > EARNED_INCOME_FLOOR
    ? roundDollars((earned - EARNED_INCOME_FLOOR) * EARNED_INCOME_RATE)
    : 0;

/*
 * Line 7 and Schedule 8812 line 21, the Additional Medicare Tax and RRTA Tax
 * Worksheet: W-2 boxes 4 and 6, plus Form 8959 line 7, less Form 8959 line 22,
 * plus half of Form 8959 line 13. Without Form 8959 it is boxes 4 and 6.
 * Tier 1 RRTA has no fact.
 */
export function withheldSocialSecurityAndMedicare(form: Lines, info: WorksheetBInfo): number {
  const line22Of8959 = sum(form["form-8959.0.line.22_additional_medicare_tax_withholding_wages"]);
  return roundDollars(
    sum(
      info.w2SocialSecurityTaxWithheld,
      info.w2MedicareTaxWithheld,
      form["form-8959.0.line.7_additional_medicare_tax_wages"],
      sum(form["form-8959.0.line.13_additional_medicare_tax_se"]) / 2,
    ) - line22Of8959,
  );
}

// Line 8 and Schedule 8812 line 22: Schedule 1 line 15 and Schedule 2 lines 5, 6 and 13.
export const scheduleOneAndTwoTaxes = (form: Lines): number =>
  sum(
    form["schedule-1.1.line.15"],
    form["schedule-2.0.line.5_ss_medicare_tax_unreported_tips"],
    form["schedule-2.0.line.6_uncollected_ss_medicare_tax_wages"],
    form["schedule-2.0.line.13_uncollected_ss_medicare_rrta_tax_w2"],
  );

/*
 * Line 10 and Schedule 8812 line 24: Form 1040 line 27a plus Schedule 3 line 11.
 * Line 27a is blank with no EIC, so its outcome tells no EIC (0) from an EIC
 * still waiting.
 */
export function eicAndScheduleThreeLine11(
  form: Lines,
  info: WorksheetBInfo,
): number | Unsupported | undefined {
  const eic = eicOutcome(form, info);
  if (eic.kind === "unsupported") return unsupported(eic.reason);
  if (eic.kind === "waiting") return undefined;
  const line27a = eic.kind === "credit" ? numberOrBlank(form["form-1040.line.27a"]) : 0;
  if (line27a === undefined) return undefined;
  return sum(line27a, form["schedule-3.0.line.11"]);
}

/*
 * Lines 6 to 11. Line 6 "No" (line 2 under $5,100, no Puerto Rico residence)
 * and "Yes" with line 5 at least line 1 both enter -0- on line 11.
 */
function line11Of(
  form: Lines,
  info: WorksheetBInfo,
  line1: number,
  line2: number,
  line5: number,
): number | Unsupported | undefined {
  if (line2 < PART_II_B_MINIMUM || line5 >= line1) return 0;
  const line9 = sum(withheldSocialSecurityAndMedicare(form, info), scheduleOneAndTwoTaxes(form));
  const line10 = eicAndScheduleThreeLine11(form, info);
  if (typeof line10 !== "number") return line10;
  return atLeast(0, line9 - line10);
}

/* Line 14, or why it cannot be figured; undefined while an input waits. */
export function worksheetBLine14(
  form: Lines,
  info: WorksheetBInfo,
): number | Unsupported | undefined {
  const line1 = numberOrBlank(form["schedule-8812.0.line.12_credit_after_phaseout"]);
  const children = numberOrBlank(form["schedule-8812.0.line.4_qualifying_children_under_17"]);
  if (line1 === undefined || children === undefined) return undefined;
  const line2 = children * ADDITIONAL_CREDIT_PER_CHILD;
  const line3 = earnedIncome(form, info);
  if (typeof line3 !== "number") return line3;
  const line5 = earnedIncomeCredit15Percent(line3);
  const line11 = line11Of(form, info, line1, line2, line5);
  if (typeof line11 !== "number") return line11;
  const line12 = Math.max(line5, line11);
  const line13 = Math.min(line2, line12);
  // "Is the amount on line 13 ... more than the amount on line 1? No. Subtract ... Yes. Enter -0-."
  return line13 > line1 ? 0 : line1 - line13;
}
