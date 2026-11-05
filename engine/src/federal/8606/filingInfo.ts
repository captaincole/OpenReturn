import type { IraOwner, TraditionalIraFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* A person with a traditional IRA: their answers and 1099-R totals. */
export interface IraHolder {
  owner: IraOwner;
  ira?: TraditionalIraFactValue;
  /* 1099-R box 1 of this person's traditional, SEP and SIMPLE IRA distributions, cents kept. */
  iraDistributionsGross: number;
  /* A 1099-R with code J or T: a Roth IRA distribution that is not qualified (Part III). */
  rothDistribution: boolean;
}

export interface Form8606FilingInfo extends BaseFilingInfo {
  /* One Form 8606 per filer (form instructions: a separate form for each spouse). */
  form8606Filers?: IraHolder[];
  /* Which filer this copy is for (renderCopies sets it); absent means the first. */
  form8606CopyIndex?: number;
}
