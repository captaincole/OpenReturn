import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form965ALine } from "./liabilityLines.js";
import type { PartIIIYear, PartIVRow } from "./sCorporations.js";

/* Part II Totals, columns (j) and (k); a string is why the total is unsupported. */
export interface PartIITotals {
  remaining?: number | string;
  paidThisYear?: number | string;
}

/* The one Form 965-A the engine prints. */
export interface Form965AInputs {
  /* Parts I and II, lines 1 to 8: undefined for a line with no fact, or while its fact misses an answer. */
  lines: ReadonlyArray<Form965ALine | undefined>;
  /* Part III, lines 1 to 4 (2017 to 2020). */
  partIII: ReadonlyArray<PartIIIYear | undefined>;
  partIV: ReadonlyArray<PartIVRow>;
  partIVTotal?: number | string;
  totals: PartIITotals;
}

export interface Form965AFilingInfo extends BaseFilingInfo {
  form965A?: Form965AInputs;
  /* Why every line of the form is unsupported (more rows than one form holds). */
  form965AGap?: string;
}
