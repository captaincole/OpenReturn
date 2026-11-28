import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { Lines1To2 } from "./lines.js";

/* Form 8932 as the resolver figures it from the facts: every line reads only facts. */
export interface Form8932Lines {
  /*
   * Lines 1 and 2 of the taxpayer's own employees, or why the engine cannot
   * figure them; undefined with no employee of its own, while an answer is
   * missing, or when a final order disallows the credit.
   */
  lines: Lines1To2 | Unsupported | undefined;
  /* Line 3: the credits from K-1s and other pass-through notices; blank with none. */
  line3: number | Unsupported | undefined;
}

export interface Form8932FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8932 does not file. */
  differentialWage?: Form8932Lines;
}
