import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { Lines1To2 } from "./lines.js";

/* Form 5884 as the resolver figures it from the facts: every line reads only facts. */
export interface Form5884Lines {
  /* Lines 1a to 2, or why the engine cannot figure them; undefined while an employee fact is malformed. */
  lines: Lines1To2 | Unsupported | undefined;
  /* Line 3: the work opportunity credits from K-1s and other pass-through notices; blank with none. */
  line3: number | Unsupported | undefined;
}

export interface Form5884FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 5884 does not file. */
  workOpportunity?: Form5884Lines;
}
