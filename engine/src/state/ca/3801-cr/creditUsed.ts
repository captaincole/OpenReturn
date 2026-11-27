/*
 * The California passive credits the return takes. FTB 3801-CR line 17 is the
 * credit allowed under the passive rules; with more than one credit,
 * Worksheets 5 to 9 share it among them (ca-3801cr-inst-2025::sec::line-17::b01).
 * Each credit "becomes allowable under the passive loss rule" and is then
 * "subject to the other limitations applicable to the use of credits"
 * (ca-3801cr-inst-2025::sec::e-passive-activity-credit-carryovers::b01):
 * Schedule P (540) Section B2 for codes 172, 183 and 185
 * (ca-540-sched-p-inst-2025::sec::credit-table::b02, ::b03, ::b06). Form 540
 * lines 43 to 45, Schedule P (540) lines 16 to 18, Schedule S line 2 and FTB
 * 3804-CR read them here. `read` takes a full field id.
 */

import {
  CA_LOW_INCOME_HOUSING_CODE,
  CA_PASSIVE_CREDIT_NAMES,
  type CaPassiveCreditCode,
} from "../../../facts/index.js";
import { isGap } from "../../../federal/3800/cells.js";
import { allocate } from "../../../federal/8582-cr/allocation.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import { numberOrBlank, sum } from "../../../money.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { filmCreditsUsedTotal, filmSectionB2Credits } from "../3541/creditUsed.js";
import { taxBeforeSectionB2 } from "../540/creditBalance.js";
import type { Form3801CRInfo } from "./filingInfo.js";
import { caPassiveEntriesOf } from "./form.js";
import { lowIncomeHousingOffsetOf } from "./lines.js";
import type { CaPassiveSource } from "./sources.js";

type ReadField = (fieldId: string) => unknown;

export interface PassiveCreditTaken {
  code: CaPassiveCreditCode;
  name: string;
  /* The credit FTB 3801-CR allows (Schedule P (540) column (a)). */
  allowed: number;
}

export const files3801Cr = (info: BaseFilingInfo) =>
  info.mustFile?.["form-3801-cr"]?.value === true;

const filesScheduleP = (info: BaseFilingInfo) => info.mustFile?.["schedule-p"]?.value === true;

const LINE_2C = "form-3801-cr.0.line.2c_housing_pre_1990_total";
const LINE_3C = "form-3801-cr.0.line.3c_housing_post_1989_total";
export const LINE_5 = "form-3801-cr.0.line.5_total_passive_credits";
const LINE_7 = "form-3801-cr.0.line.7_credits_over_passive_tax";
export const LINE_16 = "form-3801-cr.0.line.16_smaller_of_8_or_15";
export const LINE_17 = "form-3801-cr.1.line.17_passive_activity_credits_allowed";

/* Schedule P (540) Section B2 rows the passive credits fill, one code each. */
export const SECTION_B2_LINES = [16, 17, 18] as const;

/* Schedule P (540) has lines 16 to 18 for these credits; line 19 is not modeled. */
export const TOO_MANY_B2_CREDITS = unsupported(
  "The motion picture credits (FTB 3541) and the passive credits need more than the three Section B2 lines 16 to 18 the engine fills.",
);

const PUBLICLY_TRADED_GAP = unsupported(
  "A California credit from a publicly traded partnership is allowed by the PTP steps outside FTB 3801-CR (ca-3801cr-inst-2025::sec::computation-of-passive-activity-credits-allowed-for-ptps::b01, ::step-1::b01, ::step-2::b01), which the engine does not figure.",
);

/*
 * DECISION (2026-11-26, by the author): the order of use of the passive
 * credits in Section B2 is the research credit (183), the orphan drug credit
 * carryover (185), then the low-income housing credit (172).
 * - Schedule P (540) Section B2: "Generally, it is to your advantage to apply
 *   credits with limited carryovers before credits with no limitation on
 *   carryover. However, you may apply credits with no limitation on carryover
 *   first, if that is to your advantage"
 *   (ca-540-sched-p-inst-2025::sec::section-b2-instructions::b01).
 * - The business credit limitation: the credit for low-income housing is one
 *   of the credits "required to be applied after any business credits are
 *   applied" (ca-540-sched-p-inst-2025::sec::how-to-compute-the-limitation::b01).
 * The engine applies the required rule, and orders the two business credits
 * by the Credit Table, with one order for every return: the taxpayer does not
 * pick the better order.
 */
const ORDER_OF_USE: ReadonlyArray<CaPassiveCreditCode> = ["183", "185", CA_LOW_INCOME_HOUSING_CODE];

/*
 * The allowed credit of each code, in the order of use, above 0; [] with no
 * FTB 3801-CR; a gap; undefined while a line waits.
 */
export function passiveCreditsAllowed(
  read: ReadField,
  info: Form3801CRInfo,
): PassiveCreditTaken[] | Unsupported | undefined {
  if (!files3801Cr(info)) return [];
  const entries = caPassiveEntriesOf(info);
  if (entries === undefined) return undefined;
  if (entries.publiclyTraded.length > 0) return PUBLICLY_TRADED_GAP;
  if (entries.gap) return entries.gap;
  const read3801 = [LINE_2C, LINE_3C, LINE_5, LINE_7, LINE_16, LINE_17].map(read);
  const gap = read3801.find(isGap);
  if (gap) return gap;
  const [line2c, line3c, line5, line7, line16, line17] = read3801.map(numberOrBlank);
  if (line5 === undefined || line17 === undefined) return undefined;
  // Worksheets 6 and 7 share the low-income housing offset of line 17 (lines.ts).
  const housing = lowIncomeHousingOffsetOf({ line2c, line3c, line7, line16 });
  const allocation = allocate(entries.entries, { line5, line16, ...housing, line37: line17 });
  const allowedOf = (code: CaPassiveCreditCode) =>
    sum(
      ...entries.entries
        .filter((entry) => (entry.source as CaPassiveSource).code === code)
        .map((entry) => allocation.allowed.get(entry.source) ?? 0),
    );
  return ORDER_OF_USE.map((code) => ({
    code,
    name: CA_PASSIVE_CREDIT_NAMES[code],
    allowed: allowedOf(code),
  })).filter((credit) => credit.allowed > 0);
}

export interface PassiveCreditUsed extends PassiveCreditTaken {
  /* Schedule P (540) column (b), or the credit up to the tax left. */
  used: number;
}

/* Schedule P (540) column (b) of the credit's Section B2 row. */
export const sectionB2UsedField = (line: number) => `schedule-p.3.part3.${line}_credit_used_col_b`;

/*
 * The credits taken. With Schedule P (540), column (b) of lines 16 to 18
 * (ca-540-sched-p-inst-2025::sec::how-to-claim-your-credits::b01). Without it,
 * each credit in turn up to the tax left after the credits before Section B2:
 * the same column (b) rule (ca-540-sched-p-inst-2025::sec::column-a-through-column-d-instructions::b01).
 * Section B2 credits "can reduce regular tax below TMT", so no TMT floor applies.
 */
export function passiveCreditsUsed(
  read: ReadField,
  info: Form3801CRInfo,
): PassiveCreditUsed[] | Unsupported | undefined {
  const credits = passiveCreditsAllowed(read, info);
  if (credits === undefined || isGap(credits)) return credits;
  if (credits.length === 0) return [];
  // FTB 3541's Section B2 credits come first (3541/creditUsed.ts).
  const film = filmSectionB2Credits(info);
  if (film === undefined || isGap(film)) return film;
  if (film.length + credits.length > SECTION_B2_LINES.length) return TOO_MANY_B2_CREDITS;
  if (filesScheduleP(info)) {
    const used = credits.map((_, index) =>
      numberOrBlank(read(sectionB2UsedField(SECTION_B2_LINES[film.length + index]))),
    );
    if (used.some((amount) => amount === undefined)) return undefined;
    return credits.map((credit, index) => ({ ...credit, used: used[index] as number }));
  }
  const filmUsed = filmCreditsUsedTotal(read, info);
  if (typeof filmUsed !== "number") return filmUsed;
  const before = taxBeforeSectionB2(read, info);
  if (before === undefined) return undefined;
  let balance = before - filmUsed;
  return credits.map((credit) => {
    const used = Math.min(credit.allowed, balance as number);
    balance = (balance as number) - used;
    return { ...credit, used };
  });
}

/* The total taken: 0 with no FTB 3801-CR; a gap; undefined while it waits. */
export function passiveCreditsUsedTotal(
  read: ReadField,
  info: Form3801CRInfo,
): number | Unsupported | undefined {
  const credits = passiveCreditsUsed(read, info);
  if (credits === undefined || isGap(credits)) return credits;
  return sum(...credits.map((credit) => credit.used));
}
