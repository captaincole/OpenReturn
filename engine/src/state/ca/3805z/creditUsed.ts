/*
 * The enterprise zone credit the return takes, code 176: the hiring credit
 * carryover and the sales or use tax credit carryover on one line
 * (ca-3805z-booklet-2025::sec::credit-code::b01). It offsets tax in Schedule P
 * (540) Section B2 (ca-540-sched-p-inst-2025::sec::credit-table::b06), so it
 * "can reduce regular tax below TMT" and has no TMT floor. Schedule P (540),
 * Form 540 lines 43 to 45, Schedule S line 2, FTB 3801-CR and FTB 3804-CR
 * read it here. `read` takes a full field id.
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
import { taxBeforeSectionB2 } from "../540/creditBalance.js";
import { enterpriseZoneReturnGap, fieldsOf, partIOf, type Info as FiguresInfo } from "./figures.js";
import type { Form3805ZFilingInfo } from "./filingInfo.js";
import {
  BUSINESS_CREDIT_LIMIT,
  creditAvailable,
  ENTERPRISE_ZONE_CREDIT_CODE,
  ENTERPRISE_ZONE_CREDIT_NAME,
} from "./lines.js";

type ReadField = (fieldId: string) => unknown;
type Info = FiguresInfo & Form3541FilingInfo;

/* Schedule P (540) Section B2 ends at line 18 in the engine; line 19 is not modeled. */
const LAST_SECTION_B2_LINE = 18;

const files = (info: BaseFilingInfo, formId: string) => info.mustFile?.[formId]?.value === true;
export const files3805Z = (info: BaseFilingInfo) => files(info, "form-3805z");

const DISREGARDED_ENTITY = unsupported(
  "A credit carryover of a disregarded entity is limited to the regular tax with its income less the regular tax without it (ca-3805z-booklet-2025::sec::other-limitations::b01), which needs the tax figured twice; the engine does not figure it.",
);
const OVER_BUSINESS_CREDIT_LIMIT = unsupported(
  "The enterprise zone credit available is over $5,000,000, so the business credit limitation and the FTB 3870 election (ca-3805z-booklet-2025::sec::line-1d-credit-limitation::b01) can apply; the engine does not figure them.",
);
const NO_SECTION_B2_LINE = unsupported(
  "The motion picture credits (FTB 3541) fill Schedule P (540) lines 16 to 18, so the enterprise zone credit needs line 19, which the engine does not fill.",
);

/* A case the credit columns do not figure, else undefined. */
export function enterpriseZoneCreditGap(
  info: Form3805ZFilingInfo,
  available: number,
): Unsupported | undefined {
  if (info.enterpriseZone?.business?.throughDisregardedEntity) return DISREGARDED_ENTITY;
  return available > BUSINESS_CREDIT_LIMIT ? OVER_BUSINESS_CREDIT_LIMIT : undefined;
}

/*
 * DECISION (2026-11-26, by the author): Schedule P (540) column (a) of the
 * enterprise zone line holds the carryovers only up to Schedule Z line 7, the
 * limitation based on EZ business income; FTB 3805Z, not Schedule P column
 * (d), holds the carryover to 2026.
 * - Schedule P (540) column (a): "Enter the amount of credit available to
 *   offset tax", and column (d) is the carryover "available to use in future
 *   years", column (a) less column (b)
 *   (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * - FTB 3805Z line 8A column (f): the credit used on Schedule P column (b)
 *   "cannot be greater than the amount on line 8A, column (e)" (line 7), and
 *   line 8B column (g) "includes both the Schedule P ... limitation and the
 *   limitation based on EZ business income"
 *   (ca-3805z-booklet-2025::sec::part-ii-limitation-of-credits-for-corporations-individuals-estates-and-trusts::b01, ::b02).
 * The engine follows FTB 3805Z's arithmetic: only the part line 7 allows can
 * offset tax, so column (b) never passes line 7, and the full carryover is on
 * the credit's own form. Schedule P column (d) then shows only the part the
 * tax left could not take.
 *
 * The credit available: 0 with no FTB 3805Z or no credit carryover; a gap;
 * undefined while line 7 or a carryover waits.
 */
export function enterpriseZoneCreditAvailable(
  read: ReadField,
  info: FiguresInfo,
): number | Unsupported | undefined {
  if (!files3805Z(info)) return 0;
  const gap = enterpriseZoneReturnGap(info);
  if (gap !== undefined) return gap;
  const hiring = info.enterpriseZone?.hiringCarryover;
  const salesOrUse = info.enterpriseZone?.salesTaxCarryover;
  if (hiring === undefined || salesOrUse === undefined) return undefined;
  if (hiring + salesOrUse <= 0) return 0;
  const partI = partIOf(fieldsOf(read), info);
  if (partI === undefined || isGap(partI)) return partI;
  const available = creditAvailable(partI.line7, hiring, salesOrUse);
  if (available <= 0) return 0;
  return enterpriseZoneCreditGap(info, available) ?? available;
}

export interface EnterpriseZoneSectionB2Credit {
  code: string;
  name: string;
  /* Schedule P (540) column (a). */
  allowed: number;
  /* The Section B2 line the credit takes. */
  line: number;
}

/*
 * DECISION (2026-11-26, by the author): in Schedule P (540) Section B2 the
 * enterprise zone credit comes after FTB 3541's motion picture credits and
 * before FTB 3801-CR's research, orphan drug and low-income housing credits.
 * - Schedule P (540) Section B2: "Generally, it is to your advantage to apply
 *   credits with limited carryovers before credits with no limitation on
 *   carryover. However, you may apply credits with no limitation on carryover
 *   first, if that is to your advantage"
 *   (ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01).
 * - The business credit limitation: the low-income housing credit is
 *   "required to be applied after any business credits are applied"
 *   (ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01).
 * The enterprise zone carryover runs out after 10 years
 * (ca-3805z-booklet-2025::sec::ez-credits-carryover-period::b01) and the
 * research credit has none, so the general rule puts it before them, and the
 * low-income housing credit stays last; the motion picture credits keep their
 * place (decision A75). One order for every return: the taxpayer does not pick.
 *
 * The credit's Section B2 line: [] with none to take; a gap; undefined while it waits.
 */
export function enterpriseZoneSectionB2Credits(
  read: ReadField,
  info: Info,
): EnterpriseZoneSectionB2Credit[] | Unsupported | undefined {
  const available = enterpriseZoneCreditAvailable(read, info);
  if (typeof available !== "number") return available;
  if (available <= 0) return [];
  const film = filmSectionB2Credits(info);
  if (film === undefined || isGap(film)) return film;
  const line = SECTION_B2_FIRST_LINE + film.length;
  if (line > LAST_SECTION_B2_LINE) return NO_SECTION_B2_LINE;
  const code = ENTERPRISE_ZONE_CREDIT_CODE;
  return [{ code, name: ENTERPRISE_ZONE_CREDIT_NAME, allowed: available, line }];
}

/*
 * The credit taken. With Schedule P (540), column (b) of its line
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). Without
 * it, the credit up to the tax left after the credits before Section B2 and
 * the motion picture credits before it: the same column (b) rule
 * (::column-a-through-column-d-instructions::b01). 0 with none; a gap;
 * undefined while it waits.
 */
export function enterpriseZoneCreditUsed(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  const credits = enterpriseZoneSectionB2Credits(read, info);
  if (credits === undefined || isGap(credits)) return credits;
  if (credits.length === 0) return 0;
  const [credit] = credits;
  if (files(info, "schedule-p")) {
    return numberOrBlank(read(`schedule-p.3.part3.${credit.line}_credit_used_col_b`));
  }
  const film = filmCreditsUsedTotal(read, info);
  if (typeof film !== "number") return film;
  const before = taxBeforeSectionB2(read, info);
  if (before === undefined) return undefined;
  return Math.min(credit.allowed, atLeast(0, before - film));
}

/* The count of Section B2 lines the credit takes (0 or 1); a gap; undefined while it waits. */
export function enterpriseZoneSectionB2Count(
  read: ReadField,
  info: Info,
): number | Unsupported | undefined {
  const credits = enterpriseZoneSectionB2Credits(read, info);
  if (credits === undefined || isGap(credits)) return credits;
  return credits.length;
}
