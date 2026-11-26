/*
 * The prison inmate labor credit that the return takes: FTB 3507 line 6a,
 * which is Schedule P (540) Section A1 line 4 column (b). Schedule P (540)
 * line 4, Form 540 lines 43 to 45 and Schedule S line 2 read it here.
 * `read` takes a full field id.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import type { Form3507FilingInfo } from "./filingInfo.js";

type ReadField = (fieldId: string) => unknown;

export const PRISON_LABOR_CREDIT_AVAILABLE = "form-3507.0.line.5_total_available_credit";
export const PRISON_LABOR_CREDIT_CLAIMED = "form-3507.0.line.6a_credit_claimed";
export const SCHEDULE_P_EXCESS_TAX = "schedule-p.1.part3.3_excess_tax_offset_by_credits_col_c";
export const SCHEDULE_P_PRISON_LABOR_CREDIT_USED =
  "schedule-p.1.part3.4_prison_inmate_labor_credit_col_b";

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

export const files3507 = (info: BaseFilingInfo) => files(info, "form-3507");

const NONRESIDENT_RETURN = unsupported(
  "Line 6a on a Form 540NR return needs the credit limits of Form 540NR and Schedule P (540NR), which have no rules yet.",
);
const NOT_FORM_540 = unsupported(
  "Line 6a is figured only against Form 540; a fiduciary or entity return (Form 541, 100S, 565, 568) is not in the engine.",
);
const DISREGARDED_SMLLC = unsupported(
  "A credit from a disregarded single member LLC is limited to the regular tax with that LLC's income less the regular tax without it (ca-3507-form-2025::sec::c-limitations::b01), which needs the tax figured twice; the engine does not figure it.",
);
const NO_SCHEDULE_P = unsupported(
  "The credit cannot reduce regular tax below tentative minimum tax (ca-3507-form-2025::sec::c-limitations::b02), and only Schedule P (540) figures it; the decision says Schedule P (540) does not file, though a Section A1 credit attaches it (ca-540-sched-p-inst-2025::sec::b-who-must-file::b01).",
);

type Info = Form3507FilingInfo;

/* A case that Schedule P (540) line 4 cannot figure, or undefined. */
export function prisonLaborReturnGap(info: Info): Unsupported | undefined {
  if (files(info, "form-540nr")) return NONRESIDENT_RETURN;
  if (!files(info, "form-540")) return NOT_FORM_540;
  const smllcRow = (info.prisonLaborPassThroughRows ?? []).some(
    (row) => row.throughDisregardedSmllc,
  );
  if (info.prisonLaborWagesThroughSmllc === true || smllcRow) return DISREGARDED_SMLLC;
  return undefined;
}

/* A case line 6a does not handle, or undefined when it can be figured. */
export function prisonLaborCreditGap(info: Info): Unsupported | undefined {
  return prisonLaborReturnGap(info) ?? (files(info, "schedule-p") ? undefined : NO_SCHEDULE_P);
}

/*
 * Line 6a: Schedule P (540) line 4 column (b) (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01;
 * "This amount may be less than the amount on line 5 if your credit is limited
 * by your tax liability", ca-3507-form-2025::sec::line-6a::b01). Line 5 at 0
 * takes nothing.
 */
export function prisonLaborCreditClaimed(
  read: ReadField,
  info: Info,
  available: number,
): number | Unsupported | undefined {
  if (available <= 0) return 0;
  const gap = prisonLaborCreditGap(info);
  if (gap !== undefined) return gap;
  return numberOrBlank(read(SCHEDULE_P_PRISON_LABOR_CREDIT_USED));
}

/*
 * The credit Form 540 lines 43 to 45 and Schedule S line 2 take: line 6a, 0
 * with no FTB 3507 or a line 5 of 0. A gap passes through, so Form 540 never
 * drops the credit in silence. Undefined while line 6a waits.
 */
export function prisonLaborCreditOnReturn(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  if (!files3507(info)) return 0;
  if (numberOrBlank(read(PRISON_LABOR_CREDIT_AVAILABLE)) === 0) return 0;
  const gap = prisonLaborCreditGap(info);
  if (gap !== undefined) return gap;
  return numberOrBlank(read(PRISON_LABOR_CREDIT_CLAIMED));
}
