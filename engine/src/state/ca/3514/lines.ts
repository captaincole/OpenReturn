/*
 * FTB 3514's amounts from the return: Part II's investment income (Worksheet
 * 1) and Part IV's California earned income (lines 13–19, Worksheet 3). Each
 * reads the federal lines by full field id, so a form that needs them (the
 * credits, Form 540 lines 75–77) can figure them. Undefined while a line it
 * needs waits; unsupported for a case the engine does not model.
 */

import type { FormAccessor } from "../../../defineForm.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3514FilingInfo } from "./filingInfo.js";

export type Lines = FormAccessor<object>;
export type LineAmount = number | undefined | Unsupported;

export const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && (value as Unsupported).unsupported === true;

export const PASSIVE_INCOME_GAP =
  "FTB 3514 Worksheet 1 line 8 needs the net income from passive activities on Schedule 1 line 5, which the engine does not split from the rest of Schedule E.";
export const NONQUALIFIED_PLAN_GAP =
  "W-2 box 11 may hold a pension from a nonqualified plan (FTB 3514 line 15) or other deferred pay, and no fact says which part is a pension.";
export const MEDICAID_WAIVER_GAP =
  "FTB 3514 line 13 includes Medicaid waiver payments (W-2 box 12 code II) and line 14 excludes them by election; the engine does not add them to line 13, and no fact records the election.";
export const COMBAT_PAY_ELECTION_GAP =
  "Nontaxable combat pay (W-2 box 12 code Q) counts on FTB 3514 line 17 only by election, and no fact records the election.";

const federal = (form: Lines, fieldId: string) => numberOrBlank(form[fieldId]) ?? 0;

/*
 * Worksheet 1, Form 540 filers (ca-3514-inst-2025::sec::worksheet-1::b01, ::b02):
 * line 1 is Form 1040 lines 2a and 2b, line 3 is line 3b, line 5 is line 7a (a
 * loss as 0), line 11 is Schedule 1 line 8l less line 24b (at least 0), and
 * line 12 adds them. Form 8814 (lines 2 and 4) and Form 4797 (line 6) have no
 * fact kind, so they are 0. Line 8, the passive activities' net income, is a
 * gap whenever Schedule E files. Line 7a waits while Schedule D files.
 */
export function investmentIncome(form: Lines, info: Form3514FilingInfo): LineAmount {
  if (info.mustFile?.["schedule-e"]?.value === true) return unsupported(PASSIVE_INCOME_GAP);
  const line7a = numberOrBlank(form["form-1040.line.7a"]);
  if (info.mustFile?.["schedule-d"]?.value === true && line7a === undefined) return undefined;
  const line11 = atLeast(
    0,
    federal(form, "schedule-1.0.line.8l") - federal(form, "schedule-1.1.line.24b"),
  );
  return sum(
    federal(form, "form-1040.line.2a"),
    federal(form, "form-1040.line.2b"),
    federal(form, "form-1040.line.3b"),
    atLeast(0, line7a),
    line11,
  );
}

/* Part IV, lines 13–19. */
export interface PartIV {
  line13: number;
  line15: number;
  line16: number;
  line17: number;
  line18: number;
  line19: number;
}

/*
 * Line 18, Worksheet 3 (ca-3514-inst-2025::sec::worksheet-3::b01): Schedule 1
 * line 3 (business) plus line 6 (farm) plus Schedule K-1 (Form 1065) box 14
 * code A, less Schedule 1 line 15 (the deductible part of SE tax). K-1s and
 * farms have no fact kind, so they add 0. Line 3 waits while a business is on
 * the return; line 15 waits while Schedule SE files.
 */
export function businessIncome(form: Lines, info: Form3514FilingInfo): number | undefined {
  const line3 = numberOrBlank(form["schedule-1.0.line.3"]);
  const line15 = numberOrBlank(form["schedule-1.1.line.15"]);
  if (info.caEitcHasBusiness === true && line3 === undefined) return undefined;
  if (info.mustFile?.["schedule-se"]?.value === true && line15 === undefined) return undefined;
  return sum(line3, federal(form, "schedule-1.0.line.6")) - sum(line15);
}

/*
 * Lines 13–19 (ca-3514-inst-2025::sec::line-13::b01 to ::line-18::b01).
 * Line 13 is the California W-2 wages and disability pay (facts.ts). Medicaid
 * waiver payments (W-2 box 12 code II) are a gap; IHSS payments with no W-2
 * have no fact kind, so line 14 is 0. Line 15's prison
 * wages have no fact; W-2 box 11 is a gap. Line 17's combat pay is a gap while
 * a W-2 reports it. Line 19 adds lines 16, 17 and 18.
 */
export function partIV(form: Lines, info: Form3514FilingInfo): PartIV | undefined | Unsupported {
  if ((info.caNonqualifiedPlanBox11 ?? 0) > 0) return unsupported(NONQUALIFIED_PLAN_GAP);
  if (info.caMedicaidWaiverPayments !== undefined) return unsupported(MEDICAID_WAIVER_GAP);
  if (info.caCombatPay !== undefined) return unsupported(COMBAT_PAY_ELECTION_GAP);
  const line18 = businessIncome(form, info);
  if (info.caEitcWages === undefined || line18 === undefined) return undefined;
  const line13 = roundDollars(info.caEitcWages);
  const line16 = line13;
  return { line13, line15: 0, line16, line17: 0, line18, line19: sum(line16, line18) };
}
