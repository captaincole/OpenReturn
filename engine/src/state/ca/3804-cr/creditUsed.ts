/*
 * The PTE elective tax credit that the return takes: FTB 3804-CR Part II line 4.
 * It reads Form 540, Schedule S and Schedule P (540); Form 540 lines 43 to 45
 * and Schedule P (540) line 21 read it here. `read` takes a full field id.
 */

import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { passiveCreditsUsedTotal } from "../3801-cr/creditUsed.js";
import type { Form3801CRInfo } from "../3801-cr/filingInfo.js";
import { creditsBeforeSectionB2 } from "../540/creditBalance.js";
import type { ScheduleSFilingInfo } from "../schedule-s/filingInfo.js";
import { filesScheduleS, otherStateCreditTotal } from "../schedule-s/returnAmounts.js";
import type { Form3804CRFilingInfo } from "./filingInfo.js";
import { creditClaimed, taxLeftForCredit } from "./lines.js";

type ReadField = (fieldId: string) => unknown;
type Info = Form3804CRFilingInfo & Pick<ScheduleSFilingInfo, "otherStateCredits"> & Form3801CRInfo;

export const PTE_CREDIT_AVAILABLE = "form-3804-cr.0.part2.3_total_available_credit";
export const PTE_CREDIT_CLAIMED = "form-3804-cr.0.part2.4_credit_claimed_current_year";
export const SCHEDULE_P_PTE_CREDIT_USED =
  "schedule-p.3.part3.21_pte_elective_tax_credit_used_col_b";

export const files3804Cr = (info: BaseFilingInfo) =>
  info.mustFile?.["form-3804-cr"]?.value === true;

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

const NONRESIDENT_RETURN = unsupported(
  "Line 4 on a Form 540NR return needs the credit limits of Form 540NR and Schedule P (540NR), which have no rules yet.",
);
const NOT_FORM_540 = unsupported(
  "Line 4 is figured only against Form 540; a fiduciary return (Form 541) is not in the engine.",
);
const DISREGARDED_SMLLC = unsupported(
  "A credit received through a disregarded single member LLC is limited to the tax on that LLC's income (ca-3804cr-inst-2025::sec::e-limitations::b01), which needs the tax figured with and without that income; the engine does not figure it.",
);

/* A case line 4 does not handle, or undefined when it can be figured. */
export function pteCreditGap(info: Info): Unsupported | undefined {
  if (files(info, "form-540nr")) return NONRESIDENT_RETURN;
  if (!files(info, "form-540")) return NOT_FORM_540;
  if ((info.pteCreditRows ?? []).some((row) => row.throughDisregardedSmllc)) {
    return DISREGARDED_SMLLC;
  }
  return undefined;
}

/*
 * DECISION (2026-11-24, by the author, not reviewed by a person): the credit
 * is limited by the tax left, not by tentative minimum tax. Text A, the Form
 * 540 instructions: "the total amount you may claim for all credits is limited
 * by tentative minimum tax (TMT)"
 * (ca-540-inst-2025::sec::special-credits-and-nonrefundable-credits::b01).
 * Text B, this form's instructions: "This credit can reduce regular tax below
 * tentative minimum tax (TMT)" (ca-3804cr-inst-2025::sec::general-information::b03,
 * ::e-limitations::b01), and Schedule P (540) takes it in Section B4, below
 * line 11. The engine follows Text B: a form's own instructions decide, and
 * Text A is a general sentence that Schedule P's sections refine. The law
 * agrees: Revenue and Taxation Code section 17039(c)(1) says no credit reduces
 * the tax "below the tentative minimum tax, as defined by Section 17062, except
 * the following credits", and its item (AD) is "For taxable years beginning on
 * or after January 1, 2021, the credit allowed by Section 17052.10" (read on
 * 2026-11-25 from a public copy of the code; the library does not hold it).
 *
 * With no Schedule P (540): Form 540 line 35 less the credits applied before
 * this one, in Schedule P (540) Part III order: line 40 (Section A1), the
 * credit for prior year AMT (Section A2 line 10), the renter's credit (line 46,
 * Section B1), FTB 3801-CR's passive credits (Section B2 lines 16 to 18) and
 * the other state tax credit (Section B3 line 20). This credit
 * is Section B4 line 21, the last (ca-540-sched-p-inst-2025::sec::credit-table::b01,
 * ::pass-through-entity-pte-elective-tax-credit::b01). It "can reduce regular
 * tax below TMT" (ca-3804cr-inst-2025::sec::general-information::b03), so no
 * TMT floor applies. Undefined while any of them waits.
 */
export function taxBeforePteCredit(read: ReadField, info: Info): number | Unsupported | undefined {
  const tax = numberOrBlank(read("form-540.line.35_total_tax_after_credits"));
  if (tax === undefined) return undefined;
  const before = creditsBeforeSectionB2(read, info);
  if (before === undefined) return undefined;
  const otherState = filesScheduleS(info) ? otherStateCreditTotal(read, info) : 0;
  if (typeof otherState !== "number") return otherState;
  const passive = passiveCreditsUsedTotal(read, info);
  if (typeof passive !== "number") return passive;
  return taxLeftForCredit(tax, [...before, passive, otherState]);
}

/*
 * Line 4. With Schedule P (540) completed, its line 21 column (b)
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01); without
 * it, line 3 up to the tax left (ca-3804cr-inst-2025::sec::line-4-credit-claimed::b01).
 * Line 3 at 0 takes nothing.
 */
export function pteCreditClaimed(
  read: ReadField,
  info: Info,
  line3: number,
): number | Unsupported | undefined {
  const gap = pteCreditGap(info);
  if (gap !== undefined) return gap;
  if (line3 <= 0) return 0;
  if (files(info, "schedule-p")) return numberOrBlank(read(SCHEDULE_P_PTE_CREDIT_USED));
  const taxLeft = taxBeforePteCredit(read, info);
  return typeof taxLeft === "number" ? creditClaimed(line3, taxLeft) : taxLeft;
}

/*
 * The credit Form 540 lines 43 to 45 take: line 4, 0 with no FTB 3804-CR.
 * A gap passes through, so Form 540 never drops the credit in silence.
 * Undefined while line 4 waits.
 */
export function pteCreditOnReturn(read: ReadField, info: Info): number | Unsupported | undefined {
  if (!files3804Cr(info)) return 0;
  const gap = pteCreditGap(info);
  if (gap !== undefined) return gap;
  return numberOrBlank(read(PTE_CREDIT_CLAIMED));
}
