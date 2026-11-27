/*
 * The TTA credit carryovers the return takes: FTB 3809 line 1c, code 210 in
 * Schedule P (540) Section B2 (ca-540-sched-p-inst-2025::sec::credit-table::b08).
 * Form 540 lines 43 to 45, Schedule P (540) lines 16 to 18, Schedule S line
 * 2, FTB 3801-CR and FTB 3804-CR read it here. `read` takes a full field id.
 *
 * In Section B2 the TTA credit comes after FTB 3541's motion picture credits
 * and FTB 3805Z's enterprise zone credit, and before FTB 3801-CR's passive
 * credits (the DECISIONs below, decisions A85 and A87).
 */

import { isGap } from "../../../federal/3800/cells.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { atLeast, numberOrBlank } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import {
  filmCreditsUsedTotal,
  filmSectionB2Credits,
  SECTION_B2_FIRST_LINE,
} from "../3541/creditUsed.js";
import type { Form3541FilingInfo } from "../3541/filingInfo.js";
import { enterpriseZoneCreditUsed, enterpriseZoneSectionB2Count } from "../3805z/creditUsed.js";
import type { Info as Form3805ZInfo } from "../3805z/figures.js";
import { taxBeforeSectionB2 } from "../540/creditBalance.js";
import {
  creditCarryovers,
  files3809,
  hasCreditCarryover,
  recordOf,
  returnGap,
  scheduleZ,
  type Info as FiguresInfo,
} from "./figures.js";
import type { Form3809FilingInfo } from "./filingInfo.js";
import {
  creditAvailableToOffsetTax,
  limitCanBind,
  TTA_CREDIT_CODE,
  TTA_CREDIT_NAME,
} from "./lines.js";

type ReadField = (fieldId: string) => unknown;
type Info = FiguresInfo & Form3541FilingInfo & Form3805ZInfo;

export { files3809, TTA_CREDIT_CODE, TTA_CREDIT_NAME };

/* Schedule P (540) Section B2 has lines 16 to 18 (3801-cr/creditUsed.ts, SECTION_B2_LINES). */
const SECTION_B2_LAST_LINE = 18;

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;

const DISREGARDED_ENTITY = unsupported(
  "A TTA credit carryover from a disregarded business entity is limited to the regular tax with the entity's income less the regular tax without it (ca-3809-booklet-2025::sec::other-limitations::b01), which needs the tax figured twice; the engine does not figure it.",
);
const OVER_BUSINESS_CREDIT_LIMIT = unsupported(
  "Form 540 line 35 is above $5,000,000, so the business credit limitation and the FTB 3870 election (ca-3809-booklet-2025::sec::general-information::b02, ::line-1d-credit-amount-to-be-elected-as-refundable-in-future-years::b01) can apply to the TTA credit; the engine does not figure them.",
);
/*
 * The sales or use tax credit arose only for property bought and placed in
 * service by 2012 (ca-3809-booklet-2025::sec::line-1b-sales-or-use-tax-credit-carryover::b01),
 * and the part "remaining for carryover to taxable years beginning on or after
 * January 1, 2014, shall be carried over only to the succeeding 10 taxable
 * years" (::targeted-tax-area-tta-credits-carryover-period::b01), so it has
 * run out before 2025. Only the $5,000,000 limitation of an earlier year can
 * extend it ("The carryover period for disallowed credit is extended by the
 * number of taxable years the credit was not allowed", ::general-information::b03),
 * and the engine has no fact for that. A stated carryover above 0 is a gap.
 */
const SALES_CREDIT_PAST_ITS_PERIOD = unsupported(
  "A TTA sales or use tax credit carries over only 10 years from 2014 (ca-3809-booklet-2025::sec::targeted-tax-area-tta-credits-carryover-period::b01), so it reaches 2025 only when an earlier year's $5,000,000 limitation extended its period (::general-information::b03); the engine has no fact for that extension.",
);
const TOO_MANY_B2_CREDITS = unsupported(
  "The motion picture credits (FTB 3541) and the enterprise zone credit (FTB 3805Z) fill Schedule P (540) lines 16 to 18, so the TTA credit needs line 19, which the engine does not fill.",
);

/* A case the credit lines do not handle, or undefined. */
export function ttaCreditGap(info: Form3809FilingInfo): Unsupported | undefined {
  const gap = returnGap(info);
  if (gap !== undefined) return gap;
  if ((info.tta?.salesCarryover ?? 0) > 0) return SALES_CREDIT_PAST_ITS_PERIOD;
  return info.tta?.business?.throughDisregardedEntity === true ? DISREGARDED_ENTITY : undefined;
}

/*
 * Schedule P (540) column (a): both carryovers, limited by FTB 3809 Schedule Z
 * line 7 (lines.ts, creditAvailableToOffsetTax). 0 with no FTB 3809 or no
 * credit carryover; a gap; undefined while line 7 waits.
 */
export function ttaCreditAvailable(read: ReadField, info: Info): number | Unsupported | undefined {
  if (!files3809(info)) return 0;
  const has = hasCreditCarryover(info);
  if (has !== true) return has === undefined ? undefined : 0;
  const gap = ttaCreditGap(info);
  if (gap !== undefined) return gap;
  const lines = scheduleZ(recordOf(read), info);
  const carryovers = creditCarryovers(info);
  if (lines === undefined || isGap(lines)) return lines;
  if (carryovers === undefined) return undefined;
  const available = creditAvailableToOffsetTax(carryovers.hiring, carryovers.sales, lines.line7);
  return available > 0 && limitCanBind(lines.line6b) ? OVER_BUSINESS_CREDIT_LIMIT : available;
}

/*
 * DECISION (2026-11-26, by the author): in Schedule P (540) Section B2 the TTA
 * credit (code 210) comes after FTB 3541's motion picture credits and before
 * FTB 3801-CR's research, orphan drug and low-income housing credits.
 * - Schedule P (540) Section B2: "Generally, it is to your advantage to apply
 *   credits with limited carryovers before credits with no limitation on
 *   carryover. However, you may apply credits with no limitation on carryover
 *   first, if that is to your advantage"
 *   (ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01).
 * - The business credit limitation: the credit for low-income housing is one
 *   of the credits "required to be applied after any business credits are
 *   applied" (ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01).
 * The TTA credit is a business credit whose carryover is limited to 10 years
 * (ca-3809-booklet-2025::sec::carryover::b01), so both texts put it before the
 * passive credits; the film credits stay first (decision A75), and the
 * taxpayer does not pick the order.
 *
 * DECISION (2026-11-26, by the author): the TTA credit (code 210) takes the
 * Section B2 line after FTB 3805Z's enterprise zone credit (code 176), so it
 * takes the tax the enterprise zone credit leaves.
 * - FTB 3805Z: "The portion of any EZ sales or use tax credit or hiring credit
 *   remaining for carryover to taxable years beginning on or after January 1,
 *   2014, shall be carried over only to the succeeding 10 taxable years"
 *   (ca-3805z-booklet-2025::sec::ez-credits-carryover-period::b01).
 * - FTB 3809: "The portion of any TTA sales or use tax credit or hiring credit
 *   remaining for carryover to taxable years beginning on or after January 1,
 *   2014, shall be carried over only to the succeeding 10 taxable years"
 *   (ca-3809-booklet-2025::sec::targeted-tax-area-tta-credits-carryover-period::b01).
 * Section B2's rule, limited carryovers first
 * (ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01), does not pick
 * one: both carryovers are limited to the same 10 years. The engine keeps the
 * enterprise zone credit on its line (decision A79) and puts the TTA credit
 * on the next one, the order of the codes in the Credit Table
 * (::credit-table::b06, ::b08). One order for every return; it changes
 * dollars only when the tax left cannot cover both.
 */
export function ttaScheduleLine(read: ReadField, info: Info): number | Unsupported | undefined {
  const film = filmSectionB2Credits(info);
  if (film === undefined || isGap(film)) return film;
  const enterpriseZone = enterpriseZoneSectionB2Count(read, info);
  if (enterpriseZone === undefined || isGap(enterpriseZone)) return enterpriseZone;
  const line = SECTION_B2_FIRST_LINE + film.length + enterpriseZone;
  return line > SECTION_B2_LAST_LINE ? TOO_MANY_B2_CREDITS : line;
}

/* The Section B2 credit row, or null with no TTA credit to offset tax; a gap; undefined while it waits. */
export function ttaSectionB2Credit(
  read: ReadField,
  info: Info,
): { code: string; name: string; allowed: number } | null | Unsupported | undefined {
  const available = ttaCreditAvailable(read, info);
  if (typeof available !== "number") return available;
  if (available <= 0) return null;
  const line = ttaScheduleLine(read, info);
  if (typeof line !== "number") return line;
  return { code: TTA_CREDIT_CODE, name: TTA_CREDIT_NAME, allowed: available };
}

/* The Section B2 rows the TTA credit takes ahead of the passive credits: 0 or 1. */
export function ttaSectionB2RowCount(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  const credit = ttaSectionB2Credit(read, info);
  if (credit === undefined || isGap(credit)) return credit;
  return credit === null ? 0 : 1;
}

/*
 * FTB 3809 line 1c, the credit the return takes. With Schedule P (540), its
 * Section B2 line column (b) (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01;
 * line 8A column (f) is "the amount of credit carryover that is used on
 * Schedule P", ca-3809-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01).
 * Without it, column (a) up to the tax left after the credits before it (the
 * film credits, then the enterprise zone credit): the same column (b) rule
 * (::column-a-through-column-d-instructions::b01). A Section B2 credit can
 * reduce the tax below TMT. 0 with no FTB 3809.
 */
export function ttaCreditUsed(read: ReadField, info: Info): number | Unsupported | undefined {
  const available = ttaCreditAvailable(read, info);
  if (typeof available !== "number" || available <= 0) return available;
  if (files(info, "schedule-p")) {
    const line = ttaScheduleLine(read, info);
    if (typeof line !== "number") return line;
    return numberOrBlank(read(`schedule-p.3.part3.${line}_credit_used_col_b`));
  }
  const before = taxBeforeSectionB2(read, info);
  if (before === undefined) return undefined;
  const film = filmCreditsUsedTotal(read, info);
  if (typeof film !== "number") return film;
  const enterpriseZone = enterpriseZoneCreditUsed(read, info);
  if (typeof enterpriseZone !== "number") return enterpriseZone;
  return Math.min(available, atLeast(0, before - film - enterpriseZone));
}
