/*
 * Form 8936 (2025): the chart under line 5 and the arithmetic of Parts I–V.
 * Pure functions with the 2025 amounts as named constants; the per-vehicle
 * Schedule A (Form 8936) is in scheduleA.ts.
 */

import { atLeast, roundDollars, sum, sumOrBlank } from "../../money.js";
import type { FilingStatus } from "../../values.js";

/*
 * The chart under line 5, "Part II/III Limits" (the new clean vehicle credit)
 * and "Part IV Limits" (the previously owned clean vehicle credit). "Individuals
 * ... exceeding the following MAGI limits for both 2024 and 2025 can't claim the
 * applicable credit" (blank form; irs-8936-inst-2025::sec::new-clean-vehicle-certification-and::b02,
 * previously-owned-clean-vehicle-2::b03).
 */
export const NEW_VEHICLE_MAGI_LIMITS: Readonly<Record<FilingStatus, number>> = {
  single: 150_000,
  married_filing_separately: 150_000,
  head_of_household: 225_000,
  married_filing_jointly: 300_000,
  qualifying_surviving_spouse: 300_000,
};

export const PREVIOUSLY_OWNED_MAGI_LIMITS: Readonly<Record<FilingStatus, number>> = {
  single: 75_000,
  married_filing_separately: 75_000,
  head_of_household: 112_500,
  married_filing_jointly: 150_000,
  qualifying_surviving_spouse: 150_000,
};

export type LimitChart = "new" | "previously_owned";

/* "Is line 2 [line 4] more than the ... limits amount ... for your 2025 [2024] filing status?" (Schedule A lines 8c, 8d, 13b, 13c). */
export function overMagiLimit(magi: number, chart: LimitChart, status: FilingStatus): boolean {
  const limits = chart === "new" ? NEW_VEHICLE_MAGI_LIMITS : PREVIOUSLY_OWNED_MAGI_LIMITS;
  return magi > limits[status];
}

/* Line 5: the chart's abbreviation of the 2024 filing status ("S, MFS, etc."). */
export const FILING_STATUS_CODES: Readonly<Record<FilingStatus, string>> = {
  single: "S",
  married_filing_separately: "MFS",
  head_of_household: "HOH",
  married_filing_jointly: "MFJ",
  qualifying_surviving_spouse: "QSS",
};

/* Lines 1a–1e or 3a–3e, each whole dollars; a blank part stays blank. */
export interface MagiParts {
  agi: number;
  puertoRicoExcluded?: number;
  form2555Line45?: number;
  form2555Line50?: number;
  form4563Line15?: number;
}

/* Line 2 (or line 4): "Add lines 1a through 1e" (blank form). */
export function modifiedAgi(parts: MagiParts): number {
  return sum(
    parts.agi,
    parts.puertoRicoExcluded,
    parts.form2555Line45,
    parts.form2555Line50,
    parts.form4563Line15,
  );
}

/* A stated amount on a whole-dollar line; blank stays blank. */
export function wholeDollars(amount: number | undefined): number | undefined {
  return amount === undefined ? undefined : roundDollars(amount);
}

/*
 * Lines 8 and 21: line 6 + line 7 (line 19 + line 20). Line 7 (20) holds the
 * K-1 credits only when line 6 (19) is used: "All other filers figuring a
 * separate credit on line 6 also report the above credits on line 7"
 * (irs-8936-inst-2025::sec::part-ii-credit-for-business::b01, part-v-credit-for-qualified::b01).
 */
export function businessTotal(vehicleTotal: number | undefined, k1Credit: number | undefined) {
  if (vehicleTotal === undefined) return { fromK1: undefined, total: undefined };
  const fromK1 = wholeDollars(k1Credit);
  return { fromK1, total: sum(vehicleTotal, fromK1) };
}

/* The tax limit of Part III (lines 10–13) or Part IV (lines 15–18). */
export interface TaxLimitLines {
  /* Line 10 (15): Form 1040 line 18. */
  tax: number;
  /* Line 11 (16): the Schedule 3 credits the instructions list. */
  credits: number;
  /* Line 12 (17): tax − credits, -0- when zero or less. */
  room: number;
  /* Line 13 (18): the smaller of the credit and the room; blank when the room is 0 ("stop here"). */
  credit?: number;
}

/*
 * Lines 10–13 and 15–18 (blank form). "If zero or less, enter -0- and stop
 * here": line 13 (18) stays blank. The part that does not fit is lost; it does
 * not carry over (irs-8936-inst-2025::sec::line-13::b01, line-18::b01).
 */
export function taxLimit(credit: number, tax: number, credits: number): TaxLimitLines {
  const room = atLeast(0, tax - credits);
  return { tax, credits, room, credit: room === 0 ? undefined : Math.min(credit, room) };
}

/* Lines 6, 9, 14, 19 and Schedule 2 lines 1b, 1c: the total of each Schedule A amount; blank with none. */
export function totalOf(amounts: ReadonlyArray<number | undefined>): number | undefined {
  return sumOrBlank(...amounts);
}
