/*
 * Form 8801 Part III, Tax Computation Using Maximum Capital Gains Rates (the
 * blank form, lines 27–55): pure arithmetic on line 10 and the 2024 worksheet.
 */

import type { PriorYearCapitalGainWorksheet } from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import type { FilingStatus } from "../../values.js";
import { AMOUNTS_2024, taxAtAmtRates } from "./lines.js";

/* A 2024 worksheet that sends the filer to Part III. */
export type PartIIIWorksheet = Exclude<PriorYearCapitalGainWorksheet, { worksheet: "none" }>;

/* Line 46: "Multiply line 45 by 15% (0.15)"; line 49 by 20%; line 52 by 25%. */
export const FIFTEEN_PERCENT = 0.15;
export const TWENTY_PERCENT = 0.2;
export const TWENTY_FIVE_PERCENT = 0.25;

/* Lines 27–55. A line the form skips is undefined. */
export interface PartIIILines {
  line27: number;
  line28: number;
  /* Skipped with the Qualified Dividends and Capital Gain Tax Worksheet. */
  line29?: number;
  line30: number;
  line31: number;
  line32: number;
  line33: number;
  line34: number;
  line35: number;
  line36: number;
  line37: number;
  line38: number;
  line39: number;
  line40: number;
  line41: number;
  line42: number;
  line43: number;
  line44: number;
  line45: number;
  line46: number;
  line47: number;
  /* Lines 48–52 are skipped when lines 47 and 27 are the same. */
  line48?: number;
  line49?: number;
  /* Lines 50–52 are skipped when line 29 is zero or blank. */
  line50?: number;
  line51?: number;
  line52?: number;
  line53: number;
  line54: number;
  line55: number;
}

/* The 2024 worksheet amounts lines 28, 29, 30, 35 and 42 take. */
interface WorksheetAmounts {
  line28: number;
  line29?: number;
  line30: number;
  line35: number;
  line42: number;
}

/*
 * Line 28: worksheet line 4 or Schedule D Tax Worksheet line 13. "If you figured
 * your 2024 tax using the 2024 Qualified Dividends and Capital Gain Tax
 * Worksheet, skip line 29 and enter the amount from line 28 on line 30." Line 30
 * otherwise is the smaller of lines 28 + 29 and Schedule D Tax Worksheet line
 * 10. Line 35: worksheet line 5 or line 14; line 42: worksheet line 5 or line
 * 21; "if zero or less, enter -0-" (the blank form; irs-8801-inst-2025::sec::line-42::b01).
 */
function worksheetAmounts(worksheet: PartIIIWorksheet): WorksheetAmounts {
  if (worksheet.worksheet === "qualified_dividends_capital_gain") {
    const line28 = roundDollars(worksheet.line4);
    const line5 = atLeast(0, roundDollars(worksheet.line5));
    return { line28, line30: line28, line35: line5, line42: line5 };
  }
  const line28 = roundDollars(worksheet.line13);
  const line29 = roundDollars(worksheet.scheduleDLine19);
  return {
    line28,
    line29,
    line30: Math.min(line28 + line29, roundDollars(worksheet.line10)),
    line35: atLeast(0, roundDollars(worksheet.line14)),
    line42: atLeast(0, roundDollars(worksheet.line21)),
  };
}

/* Lines 48–52, with the form's two skips. */
function lines48To52(
  amounts: WorksheetAmounts,
  line27: number,
  line32: number,
  line37: number,
  line47: number,
): Pick<PartIIILines, "line48" | "line49" | "line50" | "line51" | "line52"> {
  if (line47 === line27) return {};
  const line48 = line37 - line47;
  const line49 = roundDollars(line48 * TWENTY_PERCENT);
  if (sum(amounts.line29) === 0) return { line48, line49 };
  const line50 = line32 + line47 + line48;
  const line51 = line27 - line50;
  return { line48, line49, line50, line51, line52: roundDollars(line51 * TWENTY_FIVE_PERCENT) };
}

/* Lines 27–55 (the blank form). Line 27 is line 10. */
export function partIIILines(
  line10: number,
  status: FilingStatus,
  worksheet: PartIIIWorksheet,
): PartIIILines {
  const amounts = worksheetAmounts(worksheet);
  const rates = AMOUNTS_2024[status];
  const line27 = line10;
  const line31 = Math.min(line27, amounts.line30);
  const line32 = line27 - line31;
  const line36 = atLeast(0, rates.zeroRateCeiling - amounts.line35);
  const line37 = Math.min(line27, amounts.line28);
  const line38 = Math.min(line36, line37);
  const line39 = line37 - line38;
  const line43 = line36 + amounts.line42;
  const line44 = atLeast(0, rates.fifteenRateCeiling - line43);
  const line45 = Math.min(line39, line44);
  const line46 = roundDollars(line45 * FIFTEEN_PERCENT);
  const line47 = line38 + line45;
  const late = lines48To52(amounts, line27, line32, line37, line47);
  const line33 = taxAtAmtRates(line32, status);
  const line53 = sum(line33, line46, late.line49, late.line52);
  const line54 = taxAtAmtRates(line27, status);
  return {
    line27,
    line28: amounts.line28,
    line29: amounts.line29,
    line30: amounts.line30,
    line31,
    line32,
    line33,
    line34: rates.zeroRateCeiling,
    line35: amounts.line35,
    line36,
    line37,
    line38,
    line39,
    line40: rates.fifteenRateCeiling,
    line41: line36,
    line42: amounts.line42,
    line43,
    line44,
    line45,
    line46,
    line47,
    ...late,
    line53,
    line54,
    line55: Math.min(line53, line54),
  };
}
