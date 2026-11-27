import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { OwnPlanLines } from "./lines.js";
import type { Amount } from "./totals.js";

/* Form 8881 as the resolver figures it from the facts: every line reads only facts. */
export interface Form8881Lines {
  /* The plan's own lines, or why the engine cannot figure them; undefined while the plan fact is malformed. */
  own: OwnPlanLines | Unsupported | undefined;
  /* Lines 7, 10 and 14: the credits from partnerships and S corporations; blank with none. */
  line7: Amount;
  line10: Amount;
  line14: Amount;
}

export interface Form8881FilingInfo extends BaseFilingInfo {
  /* Undefined while Form 8881 does not file. */
  smallEmployerPlan?: Form8881Lines;
}
