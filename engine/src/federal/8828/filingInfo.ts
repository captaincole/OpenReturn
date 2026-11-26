import type { MortgageSubsidyType } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { GainLines, RepaymentWorksheet } from "./lines.js";

/* The lines of Form 8828 that come from the facts alone: Part I and lines 9 to 14, 16, 19 and 20. */
export interface Form8828FactLines {
  propertyAddress: string;
  subsidyType: MortgageSubsidyType;
  /* Line 3, as printed: state, political subdivision, agency. */
  issuer: string;
  /* Line 4, as printed: name, then address. */
  lender: string;
  closingDate: string;
  saleDate: string;
  repaymentDate?: string;
  line7: { years: number; fullMonths: number };
  gain: GainLines;
  /* The subtraction on line 15. */
  gainIncludedInIncome: number;
  line16?: number;
  line19: number;
  /* In percent: the notice's table, or worksheet line H. */
  line20?: number;
  worksheet?: RepaymentWorksheet;
  /* This line and every later one are unsupported, for this reason. */
  gap?: { fromLine: number; reason: string };
}

export interface Form8828FilingInfo extends BaseFilingInfo {
  /*
   * One Form 8828 for each sold home that files, in the order first recorded:
   * "figure the actual recapture tax separately" for each home. An entry is
   * undefined while that home's notice waits.
   */
  form8828Copies?: ReadonlyArray<Form8828FactLines | undefined>;
  /* The copy being evaluated (federal/index.ts copies); absent means the first. */
  form8828CopyIndex?: number;
  /* Schedule 2 files for it: a gap, or a gain and a subsidy that can give a tax above 0. */
  form8828ReachesSchedule2?: boolean;
}
