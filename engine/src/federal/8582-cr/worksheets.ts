/*
 * Worksheets 1 to 4 of Form 8582-CR: each passive credit of Form 3800, current
 * (column (a)) or carried from last year (column (b)), on the worksheet its
 * activity and its kind of credit choose. "Enter the credits from Form 3800,
 * lines 2, 23, and 32, in column (a) of Worksheet 1, 2, 3, or 4"
 * (irs-8582cr-inst-2025::sec::specific-instructions::b01). Each source is its
 * own worksheet row: "separate the credits by activity and by type before
 * making entries in the worksheets" (same block).
 */

import type { PassiveCreditActivity } from "../../facts/index.js";
import { atLeast, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { gap, isGap } from "../3800/cells.js";
import { signedTransfer, type Carryover, type CurrentCredit } from "../3800/credits.js";

export type PassiveSource = CurrentCredit | Carryover;
export type Worksheet = 1 | 2 | 3 | 4;

export interface WorksheetEntry {
  source: PassiveSource;
  worksheet: Worksheet;
  /* Column (a): the current year credit. */
  current: number;
  /* Column (b): the prior year unallowed credit. */
  prior: number;
}

export interface PassiveEntries {
  entries: WorksheetEntry[];
  /* "Don't enter credits from PTPs on the worksheets or on Form 8582-CR" (credits-from-ptps::b02). */
  publiclyTraded: PassiveSource[];
  /* A source whose amount the engine cannot figure: every line is this gap. */
  gap?: Unsupported;
  /* A source whose activity is not stated yet: the form waits. */
  waiting: boolean;
}

/* The low-income housing credit: Part III line 4d (Form 8586); Part IV lines 4d and 2b. */
const LOW_INCOME_HOUSING_LINES = ["4d", "2b"];
/* The rehabilitation credit: line 4k (Form 3468 Part VII), first in the order of use (credit-ordering-rule::b02). */
const REHABILITATION_LINES = ["4k"];

const RECAPTURE_GAP =
  "A passive carryover with an amount recaptured (Form 3800 Part IV column (h)): Form 8582-CR lowers the prior year unallowed credit by the recapture (irs-8582cr-inst-2025::sec::prior-year-unallowed-credits::b01) and Form 3800 column (i) subtracts column (h) again (irs-3800-inst-2025::sec::part-iv-2::b04); the engine does not figure the case.";
const SOLD_MORE_GAP =
  "A passive credit sold under section 6418 for more than the credit (Form 3800 Part V column (d)(2) above column (d)(1)).";

const isCarryover = (source: PassiveSource): source is Carryover => "originYear" in source;

/*
 * The worksheet of one credit
 * (irs-8582cr-inst-2025::sec::reporting-credits-from-the-activities::b02, ::b03):
 * a married person filing separately who lived with the spouse at any time puts
 * every credit on Worksheet 4 (lines-1a-through-1c::b02, lines-3a-through-3c::b01).
 * Undefined while an answer the choice needs is missing.
 */
export function worksheetOf(
  line: string,
  activity: PassiveCreditActivity,
  livedWithSpouse: boolean,
): Worksheet | undefined {
  if (livedWithSpouse) return 4;
  if (LOW_INCOME_HOUSING_LINES.includes(line)) {
    if (activity.before1990 === undefined) return undefined;
    return activity.before1990 ? 2 : 3;
  }
  if (!activity.rentalRealEstate) return 4;
  if (REHABILITATION_LINES.includes(line)) return 2;
  if (activity.activelyParticipated === undefined) return undefined;
  return activity.activelyParticipated ? 1 : 4;
}

/* Column (a): (d)(1) less (d)(2) plus (d)(3) (irs-3800-inst-2025::sec::part-v-3::b02). */
function currentAmount(credit: CurrentCredit): number | Unsupported {
  if (isGap(credit.amount)) return credit.amount;
  const net = sum(credit.amount) + (signedTransfer(credit) ?? 0);
  return net < 0 ? unsupported(SOLD_MORE_GAP) : net;
}

/* Column (b): the carryover less the basis adjustment of a Part VI election (line-38::b01). */
function priorAmount(carryover: Carryover): number | Unsupported {
  if (isGap(carryover.amount)) return carryover.amount;
  if ((carryover.recaptured ?? 0) > 0) return gap(RECAPTURE_GAP);
  return atLeast(0, sum(carryover.amount) - sum(carryover.basisIncreaseElection?.amount));
}

const hasAmount = (source: PassiveSource) =>
  isCarryover(source)
    ? source.amount !== 0 && source.amount !== undefined
    : source.amount !== 0 || source.transfer !== undefined;

/* Every passive source of the rows on its worksheet. */
export function passiveEntriesOf(
  sources: ReadonlyArray<PassiveSource>,
  livedWithSpouse: boolean,
): PassiveEntries {
  const result: PassiveEntries = { entries: [], publiclyTraded: [], waiting: false };
  for (const source of sources.filter((each) => each.passive && hasAmount(each))) {
    const activity = source.activity;
    if (activity === undefined) {
      result.waiting = true;
      continue;
    }
    if (activity.publiclyTradedPartnership === true) {
      result.publiclyTraded.push(source);
      continue;
    }
    const amount = isCarryover(source) ? priorAmount(source) : currentAmount(source);
    const worksheet = worksheetOf(source.line, activity, livedWithSpouse);
    if (isGap(amount)) result.gap ??= amount;
    else if (worksheet === undefined) result.waiting = true;
    else {
      const carried = isCarryover(source);
      result.entries.push({
        source,
        worksheet,
        current: carried ? 0 : amount,
        prior: carried ? amount : 0,
      });
    }
  }
  return result;
}

export const totalOfEntry = (entry: WorksheetEntry) => entry.current + entry.prior;
