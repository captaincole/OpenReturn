import type { LowIncomeHousingBuildingFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Line11Worksheet } from "./lines.js";

/*
 * Part II as it prints: each line that has a value; a missing line is blank.
 * Lines 2, 5 and 9 are in ten-thousandths (lines.ts).
 */
export interface Form8609APartII {
  line1?: number;
  line2?: number;
  line3?: number;
  line4?: number;
  line5?: number;
  line6?: number;
  line7?: number;
  line8?: number;
  line9?: number;
  line10?: number;
  line11?: number;
  line12?: number;
  line13?: number;
  line14?: number;
  line15?: number;
  line16?: number;
  line17?: number;
  line18?: number;
}

/* One Form 8609-A: one building fact (irs-8609a-inst-2025::sec::general-instructions::b01). */
export interface Form8609ACopy {
  key: string;
  /* Part I's items, from the fact. */
  building: LowIncomeHousingBuildingFactValue;
  partII: Form8609APartII;
  /* The Line 11 Worksheet, kept for the owner's records (line-14::b02). */
  worksheet?: Line11Worksheet;
  /* The fact this copy waits on: Part II is blank. */
  waitingOn?: string[];
  /* This line and every later one are unsupported, for this reason. */
  gap?: { fromLine: number; reason: string };
}

export interface Form8609AFilingInfo extends BaseFilingInfo {
  /* One Form 8609-A for each building fact in its compliance period, in the order recorded. */
  form8609ACopies?: ReadonlyArray<Form8609ACopy>;
  /* The copy being evaluated (federal/index.ts copies); absent means the first. */
  form8609ACopyIndex?: number;
}
