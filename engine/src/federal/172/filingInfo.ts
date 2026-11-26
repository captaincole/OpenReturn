import type { NolCarrybackYearValue, NolCarryoverRow } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* What Form 172 reads besides other forms' lines; resolve172Info fills it when the form files. */
export interface Form172Figures {
  /* A Schedule F of the return shows a loss, so part of the NOL can be a farming loss. */
  farmLoss: boolean;
  /* The election to waive the farming loss carryback; undefined while not stated. */
  waivesFarmingCarryback?: boolean;
  /* Part II: the stated amounts of the 2023 and 2024 returns; undefined while not stated. */
  carryback2023?: NolCarrybackYearValue;
  carryback2024?: NolCarrybackYearValue;
  /* A Schedule K-1 is on the return: its farming items cannot be told apart (the farming loss). */
  passThroughOnReturn: boolean;
  /*
   * The net gain (above 0) or loss (below 0) of the year's capital assets of
   * the taxpayer's trades or businesses, the Form 461 answer; 0 when not stated.
   */
  businessCapitalNet: number;
}

export interface Form172FilingInfo extends BaseFilingInfo {
  /* Undefined when Form 172 does not file. */
  form172?: Form172Figures;
  /* Schedule 1 line 8a: the NOLs carried to 2025, whether or not Form 172 files; undefined when none is stated. */
  nolCarryovers?: NolCarryoverRow[];
  /* Why the carryover answer cannot be read. */
  nolCarryoverGap?: string;
}
