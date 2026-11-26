/*
 * The farm rentals' totals for Schedule E. Form 4835 is one farm's form (line
 * A: "this farm", irs-4835-inst-2025::sec::face-header::b01; line 34: "your
 * investment in this activity"), so each farm rental prints its own copy, and
 * Schedule E line 40, "Net farm rental income or (loss) from Form 4835"
 * (irs-1040se-face-2025::sec::face-part-v::b01), takes the total of their line
 * 32 or 34c. One farm's gap is the total's gap; one farm that waits keeps the
 * total waiting.
 */

import { sum } from "../../money.js";
import type { FarmRentalSummary, Form4835Copy, Form4835FilingInfo } from "./filingInfo.js";
import { isGap, type Line } from "./lines.js";

/* One farm rental's form and the amounts Schedule E and FTB 3801 read. */
export interface FarmOutcome {
  copy: Form4835Copy;
  summary: FarmRentalSummary;
  /* Line 7; undefined while it waits or with no income. */
  gross: Line<number>;
  waitingKeys: string[];
}

/* Line 40: every farm's line 32 or 34c. */
function totalNet(nets: ReadonlyArray<Line<number>>): Line<number> {
  const gap = nets.find(isGap);
  if (gap) return gap;
  if (nets.some((net) => net === undefined)) return undefined;
  return sum(...nets.filter((net): net is number => typeof net === "number"));
}

/* Line 42: every farm's line 7; a farm whose line 7 and line 40 both wait keeps it waiting. */
function totalGross(farms: ReadonlyArray<FarmOutcome>): Line<number> {
  const gap = farms.map((farm) => farm.gross).find(isGap);
  if (gap) return gap;
  if (farms.some((farm) => farm.gross === undefined && farm.summary.net === undefined)) {
    return undefined;
  }
  const amounts = farms.flatMap((farm) => (typeof farm.gross === "number" ? [farm.gross] : []));
  return amounts.length === 0 ? undefined : sum(...amounts);
}

/* Line 43's part: the farms a real estate professional materially participated in. */
function line43Part(farms: ReadonlyArray<FarmOutcome>): number | "waits" | undefined {
  const counted = farms.filter((farm) => farm.summary.nonpassive !== false);
  if (counted.length === 0) return undefined;
  const nets = counted.map((farm) =>
    farm.summary.nonpassive === true ? farm.summary.net : undefined,
  );
  if (nets.some((net) => typeof net !== "number")) return "waits";
  return sum(...(nets as number[]));
}

export function farmTotals(farms: ReadonlyArray<FarmOutcome>): Form4835FilingInfo {
  return {
    ...farms[0].copy,
    form4835Copies: farms.map((farm) => farm.copy),
    farmRentals: farms.map((farm) => farm.summary),
    farmRentalInUse: true,
    farmRentalNet: totalNet(farms.map((farm) => farm.summary.net)),
    farmRentalGross: totalGross(farms),
    farmRentalLine43: line43Part(farms),
  };
}
