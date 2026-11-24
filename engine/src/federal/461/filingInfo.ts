import type { BaseFilingInfo } from "../../filingInfo.js";
import type { K1Nonbusiness, NonbusinessColumn } from "./classify.js";

/* Lines of Part I that the engine cannot fill, with the reason. */
export interface Form461LineGaps {
  /* Schedule 1 line 4: Form 4797 files, and it has no rules. */
  line4?: string;
  /* Schedule 1 line 5: a K-1 the limits stopped, a continuation sheet, Form 4835. */
  line5?: string;
  /* Schedule 1 line 6: Schedule F files, and it has no rules. */
  line6?: string;
}

/* What Form 461's lines read besides other forms' lines; resolve461Info fills it. */
export interface Form461Figures {
  /* Line 15: $313,000, or $626,000 on a joint return. */
  threshold: number;
  /* The taxpayer's net capital gain or loss from business capital assets; 0 when none is stated. */
  businessCapitalGain: number;
  /* Line 8, signed; undefined when none is stated. */
  otherBusinessIncome?: number;
  /* Schedule E Part I columns not from a trade or business; undefined while an answer is missing. */
  nonbusinessColumns?: NonbusinessColumn[];
  /* The K-1 amounts on Schedule E not from a trade or business; undefined while a K-1 waits. */
  k1Nonbusiness?: K1Nonbusiness;
  gaps: Form461LineGaps;
}

export interface Form461FilingInfo extends BaseFilingInfo {
  /* Undefined when Form 461 does not file. */
  form461?: Form461Figures;
}
