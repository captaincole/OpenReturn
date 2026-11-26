/*
 * Form 172's figures from the return: Part I's lines and Part II's columns,
 * so every field reads one computation.
 */

import { atLeast, numberOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { isGap, nolAmount, partI, type PartIInputs, type PartILines } from "./lines.js";
import { carrybackColumns, type CarrybackColumns } from "./partII.js";
import {
  capitalInputs,
  nolDeductionOtherYears,
  nonbusinessDeductions,
  nonbusinessIncome,
  type Info,
  type Read,
} from "./reads.js";
import { carrybackYearComplete } from "./resolveInfo.js";

export const FARMING_LOSS_GAP =
  "A farming loss is the NOL figured with only the income and deductions of farming businesses (irs-172-inst-2025::sec::when-to-use-an-nol::b02); with a Schedule K-1 or a Form 4797 on the return the engine cannot tell their farming items apart.";

/* Part I needs nothing else when line 1 is zero or more. */
const NO_LOSS_INPUTS: Omit<PartIInputs, "agi" | "deduction"> = {
  nonbusinessCapitalLosses: 0,
  nonbusinessCapitalGains: 0,
  nonbusinessDeductions: 0,
  nonbusinessIncome: 0,
  businessCapitalLosses: 0,
  businessCapitalGains: 0,
  scheduleDLoss: 0,
  section1202Exclusion: 0,
  marriedFilingSeparately: false,
  nolDeductionOtherYears: 0,
};

/*
 * Part I; undefined when the form does not file or while a line waits. Line
 * 17 is 0: the engine claims no section 1202 exclusion (Form 8949 column (g)
 * is not modeled), so the return has none.
 */
export function partILinesOf(form: Read, info: Info): PartILines | undefined {
  if (info.form172 === undefined) return undefined;
  const agi = numberOrBlank(form["form-1040.line.11a"]);
  const deduction = numberOrBlank(form["form-1040.line.12e"]);
  if (agi === undefined || deduction === undefined) return undefined;
  if (agi - deduction >= 0) return partI({ agi, deduction, ...NO_LOSS_INPUTS });
  const capital = capitalInputs(form, info);
  const line23 = nolDeductionOtherYears(form, info);
  if (capital === undefined || line23 === undefined) return undefined;
  return partI({
    agi,
    deduction,
    ...capital,
    nonbusinessDeductions: nonbusinessDeductions(form, info, deduction),
    nonbusinessIncome: nonbusinessIncome(form),
    section1202Exclusion: 0,
    marriedFilingSeparately: info.filingStatus === "married_filing_separately",
    nolDeductionOtherYears: line23,
  });
}

/*
 * The farming loss carried back: "the smaller of: The amount that would be
 * the NOL for the tax year if only income and deductions from farming
 * businesses ... were taken into account, or The NOL for the tax year"
 * (::when-to-use-an-nol::b01, ::b02). With only the farms' items, that NOL
 * is the net Schedule F loss on Schedule 1 line 6 (QUESTIONS.md).
 */
function farmingLossOf(form: Read, info: Info, nol: number): number | Unsupported | undefined {
  if (info.form172?.passThroughOnReturn || info.mustFile?.["form-4797"]?.value === true) {
    return unsupported(FARMING_LOSS_GAP);
  }
  const line6 = numberOrBlank(form["schedule-1.0.line.6"]);
  return line6 === undefined ? undefined : Math.min(atLeast(0, -line6), nol);
}

/*
 * Part II: "none" when nothing is carried back (no farm loss, no NOL, or the
 * carryback waived); the gap; undefined while an answer or a line waits.
 */
export function carrybackOf(
  form: Read,
  info: Info,
): CarrybackColumns | Unsupported | "none" | undefined {
  const figures = info.form172;
  if (figures === undefined) return undefined;
  if (!figures.farmLoss || figures.waivesFarmingCarryback === true) return "none";
  const lines = partILinesOf(form, info);
  if (lines === undefined) return undefined;
  const nol = nolAmount(lines);
  if (isGap(nol)) return nol;
  if (nol === 0) return "none";
  if (figures.waivesFarmingCarryback === undefined) return undefined;
  const farmingLoss = farmingLossOf(form, info, nol);
  if (farmingLoss === undefined || isGap(farmingLoss)) return farmingLoss;
  if (farmingLoss === 0) return "none";
  const complete = (year: typeof figures.carryback2023) =>
    carrybackYearComplete(year) ? year : undefined;
  const columns = carrybackColumns(
    farmingLoss,
    complete(figures.carryback2023),
    complete(figures.carryback2024),
  );
  return columns ?? undefined;
}
