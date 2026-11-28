import type { CleanHydrogenFacilityFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Unsupported } from "../../types.js";
import type { Form7210 } from "./types.js";

export type CellValue = number | string | boolean | Unsupported | undefined;
/* One copy's printed values, keyed by the catalog field after "form-7210.". */
export type Form7210Cells = Partial<Record<keyof Form7210, CellValue>>;

export interface Form7210Copy {
  /* The facility fact, or K1_ONLY_COPY for a form that holds only K-1 credits. */
  key: string;
  cells: Form7210Cells;
  /* The facility; undefined on the K-1 copy. */
  facility?: CleanHydrogenFacilityFactValue;
  /* Line 10 for Form 3800 Part III line 1g; undefined while waiting and on the K-1 copy. */
  line10?: number | Unsupported;
  /* An answer of the facility is missing: the fact is listed in missingInputs. */
  waiting: boolean;
}

export interface Form7210FilingInfo extends BaseFilingInfo {
  /* Every Form 7210 of the return, one for each facility; undefined while the form does not file. */
  form7210Copies?: Form7210Copy[];
  /* The copy rendered. */
  form7210CopyIndex?: number;
}
