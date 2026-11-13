import type {
  IraOwner,
  RetirementDistributionFactValue,
  RothIraFactValue,
  TraditionalIraFactValue,
} from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* A person with a traditional IRA: their answers and 1099-R totals. */
export interface IraHolder {
  owner: IraOwner;
  ira?: TraditionalIraFactValue;
  /* 1099-R box 1 of this person's traditional, SEP and SIMPLE IRA distributions, cents kept. */
  iraDistributionsGross: number;
  /* Lines 1 + 2: nondeductible contributions for 2025 and the basis from earlier years. */
  basis: number;
  /* Line 7: the distributions less rollovers and Roth conversions, at least 0, cents kept. */
  line7: number;
  /* Part I applies (the bullets at the top of Part I). Then line 15c, not the 1099-Rs, gives 1040 line 4b. */
  partI: boolean;
  /* A 1099-R with code J or T: a Roth IRA distribution that is not qualified (Part III). */
  rothDistribution: boolean;
  /* Part III: the person's code J and T 1099-Rs and their Roth IRA answers. */
  rothRows: RetirementDistributionFactValue[];
  roth?: RothIraFactValue;
}

export interface Form8606FilingInfo extends BaseFilingInfo {
  /* One Form 8606 per filer (form instructions: a separate form for each spouse). */
  form8606Filers?: IraHolder[];
  /* Which filer this copy is for (renderCopies sets it); absent means the first. */
  form8606CopyIndex?: number;
}
