/*
 * FTB 3805V Part III: the prior year carryovers used in 2025 and the
 * carryovers to 2026, as pure functions of amounts
 * (ca-3805v-inst-2025::sec::part-iii-limitations, ::declared-disasters::b16,
 * ::b17, ::current-year-nols; the form).
 */

import type { CaNolCarryoverRow, CaNolType } from "../../../facts/index.js";
import { roundDollars, sum } from "../../../money.js";

/* Line 2 prints four rows of prior year NOLs; line 4 prints three current year rows (the form). */
export const PRIOR_ROWS = 4;
export const CURRENT_ROWS = 3;
/* The current year disaster row's type and the general type (the form's footnote). */
export const DISASTER: CaNolType = "DIS";
export const GENERAL: CaNolType = "GEN";

/*
 * The NOL Carryover table: a general, new business or eligible small business
 * NOL from 2008 on carries over 20 years at 100% (ca-3805v-inst-2025::sec::nol-carryover::b02,
 * ::b09 to ::b14); a disaster loss NOL from 2011 on takes the NOL rules
 * (::nol-carryover::b08). An older loss has expired unless a suspension extended
 * it (::b15, ::general-information::b04 to ::b06), which the engine does not
 * track. A prior year row is a loss of 2024 or before.
 */
export const FIRST_NOL_YEAR = 2008;
export const FIRST_DISASTER_YEAR = 2011;
export const LAST_PRIOR_YEAR = 2024;

export const OLD_LOSS_GAP =
  "A carryover from a general, new business or eligible small business loss before 2008, or a disaster loss before 2011, has a carryover period that the suspensions extended (ca-3805v-inst-2025::sec::nol-carryover::b15); the engine does not track those periods.";
export const NOT_PRIOR_YEAR_GAP =
  "A prior year carryover row names a year of loss after 2024; Part III line 2 lists only losses of earlier years.";

/* Why the engine cannot use the row, else undefined. */
export function carryoverRowGap(row: CaNolCarryoverRow): string | undefined {
  if (row.yearOfLoss > LAST_PRIOR_YEAR) return NOT_PRIOR_YEAR_GAP;
  const first = row.type === DISASTER ? FIRST_DISASTER_YEAR : FIRST_NOL_YEAR;
  return row.yearOfLoss < first ? OLD_LOSS_GAP : undefined;
}

export interface CarryoverRowLines {
  yearOfLoss: number;
  code?: string;
  type: CaNolType;
  /* Column (d). */
  initialLoss: number;
  /* Column (e). */
  carryover: number;
  /* Column (f): amount used in 2025. */
  used: number;
  /* Column (g): available balance after this row. */
  balance: number;
  /* Column (h): carryover to 2026. */
  carryForward: number;
}

export interface PriorYearLines {
  /* Line 1 column (g): MTI from Part II line 6. */
  line1: number;
  rows: CarryoverRowLines[];
  /* Column (f) of the disaster rows: Schedule CA (540) line 9b1. */
  disasterUsed: number;
  /* Column (f) of the other rows: Schedule CA (540) line 9b2. */
  nolUsed: number;
}

/*
 * Line 2, "Enter the years, earliest first" (::part-iii-limitations::b02), and
 * "use your NOLs and disaster losses in the order the losses were incurred"
 * (::b01). Column (f): "the smaller of the amount in column (e) or the balance
 * in column (g)"; column (g): the previous balance less column (f); column (h):
 * column (e) less column (f) (::declared-disasters::b17). Rows of the same year
 * keep the order recorded. While suspended, a row that is not a disaster loss
 * takes nothing (DECISION in figures.ts).
 */
export function priorYearLines(
  rows: ReadonlyArray<CaNolCarryoverRow>,
  mti: number,
  suspended: boolean,
): PriorYearLines {
  const ordered = [...rows].sort((first, second) => first.yearOfLoss - second.yearOfLoss);
  let balance = mti;
  const lines = ordered.map((row): CarryoverRowLines => {
    const carryover = roundDollars(row.carryoverFrom2024);
    const allowed = suspended && row.type !== DISASTER ? 0 : Math.min(carryover, balance);
    balance -= allowed;
    return {
      yearOfLoss: row.yearOfLoss,
      code: row.code,
      type: row.type,
      initialLoss: roundDollars(row.initialLoss),
      carryover,
      used: allowed,
      balance,
      carryForward: carryover - allowed,
    };
  });
  const usedOf = (disaster: boolean) =>
    sum(...lines.filter((row) => (row.type === DISASTER) === disaster).map((row) => row.used));
  return { line1: mti, rows: lines, disasterUsed: usedOf(true), nolUsed: usedOf(false) };
}

/*
 * Line 5: "Add the carryover amounts in column (h) that are not the result of a
 * disaster loss"; line 6: "the total loss carryover amounts in column (h) that
 * are the result of disaster losses" (the form). The current year NOL (line 4)
 * and the current year disaster loss left (line 3) count with them.
 */
export function carryoverTotals(
  rows: ReadonlyArray<CarryoverRowLines>,
  currentNol: number,
  currentDisaster: number,
): { line5: number; line6: number } {
  const carried = (disaster: boolean) =>
    sum(
      ...rows.filter((row) => (row.type === DISASTER) === disaster).map((row) => row.carryForward),
    );
  return { line5: carried(false) + currentNol, line6: carried(true) + currentDisaster };
}
