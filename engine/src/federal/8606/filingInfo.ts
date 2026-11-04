import type { IraOwner, TraditionalIraFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* One Form 8606 per person who must file one (form instructions: a separate form for each spouse). */
export interface Form8606Person {
  owner: IraOwner;
  ira?: TraditionalIraFactValue;
  /* 1099-R box 1 of this person's traditional, SEP and SIMPLE IRA distributions, cents kept. */
  iraDistributionsGross: number;
}

export interface Form8606FilingInfo extends BaseFilingInfo {
  form8606Persons?: Form8606Person[];
  /* Which person this copy is for (renderCopies sets it); absent means the first. */
  form8606CopyIndex?: number;
}
