import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Gap } from "./lines.js";
import type { Form4835Printed } from "./printed.js";

/* One printed Form 4835: its fields, or the gap that covers every line. Both keys are always set. */
export interface Form4835Copy {
  form4835: Form4835Printed | undefined;
  form4835Gap: string | undefined;
}

/* What FTB 3801 reads of one farm rental: its Schedule E line 40 part and whether it is passive. */
export interface FarmRentalSummary {
  factKey: string;
  /* Line 32 or line 34c; undefined while it waits or with no amounts. */
  net?: number | Gap;
  /* A real estate professional materially participated (line-34::b01); undefined while unknown. */
  nonpassive?: boolean;
}

export interface Form4835FilingInfo extends BaseFilingInfo {
  /* The Form 4835 being printed (the first copy, or the one the copy select picks). */
  form4835?: Form4835Printed;
  /* Why every line of the printed form is unsupported (no farm rental fact, a line 4c loss). */
  form4835Gap?: string;
  /* One copy for each farm rental, in fact order; undefined when one gap covers the form. */
  form4835Copies?: Form4835Copy[];
  /* Each farm rental on the return, in fact order; undefined when one gap covers the form. */
  farmRentals?: FarmRentalSummary[];
  /* A Form 4835 files with a farm rental fact: Schedule E line 41 waits on line 40. */
  farmRentalInUse?: boolean;
  /* Schedule E line 40: the total of each Form 4835's line 32 or line 34c; undefined while one waits. */
  farmRentalNet?: number | Gap;
  /* Schedule E line 42: the total of each Form 4835's line 7; undefined while one waits or with no income. */
  farmRentalGross?: number | Gap;
  /*
   * Schedule E line 43's farm rental part: the farm rentals a real estate
   * professional materially participated in; "waits" while an answer or a line
   * 40 amount is missing; undefined with none.
   */
  farmRentalLine43?: number | "waits";
}
