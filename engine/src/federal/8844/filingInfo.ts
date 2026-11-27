import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { Form3800FilingInfo } from "../3800/filingInfo.js";

/* One business or farm that paid qualified zone wages, with its share of line 2. */
export interface Form8844Employer {
  key: string;
  /* The activity's name, for Form 8582-CR when the credit is passive. */
  name: string;
  credit: number;
  /* The owner did not materially participate (Schedule C line G, Schedule F line E): a passive credit. */
  passive: boolean;
}

export interface Form8844Figures {
  line1: number | Unsupported;
  line2: number | Unsupported;
  employers: Form8844Employer[];
}

/* Line 3 reads the pass-through credits Form 3800 holds for its Part III line 3. */
export interface Form8844FilingInfo
  extends BaseFilingInfo, Pick<Form3800FilingInfo, "form3800Sources"> {
  /* Undefined while Form 8844 does not file. */
  form8844?: Form8844Figures;
}
