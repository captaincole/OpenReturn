import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Gap } from "./lines.js";
import type { Form4835Printed } from "./printed.js";

export interface Form4835FilingInfo extends BaseFilingInfo {
  /* The one Form 4835 the engine prints: each field's value or gap; undefined with no farm rental. */
  form4835?: Form4835Printed;
  /* Why every line of the form is unsupported (more than one farm rental, a line 4c loss). */
  form4835Gap?: string;
  /* A Form 4835 files with a farm rental fact: Schedule E line 41 waits on line 40. */
  farmRentalInUse?: boolean;
  /* Schedule E line 40: Form 4835 line 32 or line 34c; undefined while it waits. */
  farmRentalNet?: number | Gap;
  /* Schedule E line 42: Form 4835 line 7; undefined while it waits or with no income. */
  farmRentalGross?: number | Gap;
  /* Schedule E line 43: a real estate professional materially participated in the farm rental. */
  farmRentalNonpassive?: boolean;
}
