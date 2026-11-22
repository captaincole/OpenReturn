/*
 * MANUAL EDIT: the Line 8 Credit Limit Worksheet's inputs, and the engine gaps
 * that leave line 9 unsupported. Schedule 3 line 6g and Schedule 8812 line 13
 * read the gap too: 6g prints the reason, and line 13 stops waiting for 6g.
 * Lines are read by full field id, so any form's accessor works.
 */

import type { FormAccessor } from "../../defineForm.js";
import { numberOrBlank, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { cleanVehicleCreditGap } from "../8936/credit.js";
import type { Form8936FilingInfo } from "../8936/filingInfo.js";
import { worksheetBLine14, type WorksheetBInfo } from "../schedule-8812/worksheetB.js";
import type { Form8396FilingInfo } from "./filingInfo.js";
import { certificateCredit, creditLimit, type CreditLimit } from "./lines.js";

type Lines = FormAccessor<object>;
export type CreditLimitInfo = Form8396FilingInfo & WorksheetBInfo & Form8936FilingInfo;

export const isUnsupported = (value: object): value is Unsupported => "unsupported" in value;

/*
 * Worksheet line 2 names Schedule 3 lines the engine does not compute yet. While
 * one of their forms files, the total would leave its credit out.
 */
const UNCOMPUTED_CREDITS: ReadonlyArray<[formId: string, line: string]> = [
  ["form-1116", "Schedule 3 line 1 (Form 1116)"],
  ["form-8863", "Schedule 3 line 3 (Form 8863)"],
  ["form-8880", "Schedule 3 line 4 (Form 8880)"],
  ["form-8978", "Schedule 3 line 6l (Form 8978)"],
];

/*
 * Worksheet line 2's first amount: Form 1040 line 19, or, with a qualifying
 * child under 17 (Schedule 8812 line 4 above 0), line 14 of Credit Limit
 * Worksheet B (irs-8396-form-2025::sec::line-8-credit-limit-worksheet::b01;
 * irs-1040s8-inst-2025::sec::line-21::b03). Form 2555, which turns Worksheet B
 * off, has no fact.
 */
function childCredit(form: Lines, info: CreditLimitInfo): number | Unsupported | undefined {
  if (sum(form["schedule-8812.0.line.4_qualifying_children_under_17"]) > 0) {
    return worksheetBLine14(form, info);
  }
  return sum(form["form-1040.line.19"]);
}

/* The Line 8 Credit Limit Worksheet, or why the engine cannot figure it. */
export function creditLimitOf(
  form: Lines,
  info: CreditLimitInfo,
): CreditLimit | Unsupported | undefined {
  const missing = UNCOMPUTED_CREDITS.find(([formId]) => info.mustFile?.[formId]?.value === true);
  if (missing) {
    return unsupported(
      `Line 2 of the Credit Limit Worksheet takes ${missing[1]}, which the engine does not compute yet.`,
    );
  }
  // Schedule 3 lines 6f and 6m (Form 8936) are figured; a gap there is a gap here.
  const vehicleGap = cleanVehicleCreditGap(form, info);
  if (vehicleGap !== undefined) {
    return unsupported(
      `Line 2 of the Credit Limit Worksheet takes Schedule 3 line 6f or 6m: ${vehicleGap}`,
    );
  }
  const child = childCredit(form, info);
  if (child === undefined || typeof child !== "number") return child;
  const line18 = numberOrBlank(form["form-1040.line.18"]);
  if (line18 === undefined) return undefined;
  const otherCredits = sum(
    child,
    form["schedule-3.0.line.1"],
    form["schedule-3.0.line.2"],
    form["schedule-3.0.line.3"],
    form["schedule-3.0.line.4"],
    form["schedule-3.0.line.6d"],
    form["schedule-3.0.line.6f"],
    form["schedule-3.0.line.6l"],
    form["schedule-3.0.line.6m"],
    form["form-5695.3.line.32"],
  );
  return creditLimit(line18, otherCredits);
}

/* Why line 9 is unsupported while Form 8396 files; undefined when it is not (yet). */
export function mortgageCreditGap(form: Lines, info: CreditLimitInfo): string | undefined {
  if (info.mustFile?.["form-8396"]?.value !== true) return undefined;
  const certificate = info.mortgageCreditCertificate;
  const credit = certificate === undefined ? undefined : certificateCredit(certificate);
  if (credit !== undefined && isUnsupported(credit)) return credit.reason;
  const limit = creditLimitOf(form, info);
  return limit !== undefined && isUnsupported(limit) ? limit.reason : undefined;
}
