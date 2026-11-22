/*
 * Schedule A (Form 8936), Clean Vehicle Credit Amount: one per vehicle. The
 * engine has no catalog for the schedule, so it is not printed; its lines feed
 * Form 8936 lines 6, 9, 14 and 19, and Schedule 2 lines 1b and 1c. The steps
 * follow the 2025 schedule's questions in order.
 */

import type { CleanVehicleFactValue } from "../../facts/index.js";
import { roundDollars } from "../../money.js";
import type { FilingStatus } from "../../values.js";
import { overMagiLimit, type LimitChart } from "./lines.js";

/* "Taxpayers cannot claim clean vehicle credits for ... vehicles that they acquired after September 30, 2025" (irs-8936-inst-2025::sec::what-s-new::b01). */
export const LAST_ACQUIRED_DATE = "2025-09-30";
/* Lines 6 and 7: "acquired after 2022". */
export const FIRST_ACQUIRED_DATE = "2023-01-01";
export const TAX_YEAR_PREFIX = "2025-";
/* Line 13e: "Is the sales price of the vehicle more than $25,000?" */
export const PREVIOUSLY_OWNED_PRICE_LIMIT = 25_000;
/* Line 15: "Multiply line 14 by 30% (0.30)". */
export const PREVIOUSLY_OWNED_RATE = 0.3;
/* Line 16: "Maximum vehicle credit amount $4,000". */
export const PREVIOUSLY_OWNED_MAXIMUM = 4_000;
/* Line 22: 15%, or 30% when line 18d is "No" (irs-8936-inst-2025::sec::line-18d::b01). */
export const COMMERCIAL_RATE_WITH_ENGINE = 0.15;
export const COMMERCIAL_RATE_WITHOUT_ENGINE = 0.3;
/* Line 25: $7,500, or $40,000 with a GVWR of 14,000 pounds or more (qualified-commercial-clean-vehicle::b03). */
export const COMMERCIAL_MAXIMUM = 7_500;
export const COMMERCIAL_MAXIMUM_HEAVY = 40_000;
export const HEAVY_VEHICLE_POUNDS = 14_000;
const MONTHS_IN_YEAR = 12;

/* Form 8936 Part I as Schedule A lines 8c, 8d, 13b and 13c read it. */
export interface MagiAnswers {
  status2025?: FilingStatus;
  /* Form 8936 line 2; undefined while it waits. */
  line2?: number;
  /* Form 8936 line 4 and line 5; undefined while the 2024 answers wait. */
  line4?: number;
  status2024?: FilingStatus;
}

/* How far into Form 8936 Part I the vehicle's questions went: lines 1–2 (8c, 13b), lines 3–5 (8d, 13c). */
export type PartIReach = 0 | 1 | 2;

export type VehicleOutcome =
  | { kind: "new"; line9: number; line10: number; line11: number; line12?: number }
  | { kind: "previously_owned"; line14: number; line15: number; line16: number; line17: number }
  | {
      kind: "commercial";
      line19: number;
      line20?: number;
      line21: number;
      line22: number;
      line23: number;
      line24: number;
      line25: number;
      line26: number;
    }
  /* Line 4b checked: the transferred credit goes back on Schedule 2 line 1b (new) or 1c (previously owned). */
  | { kind: "repay"; schedule2Line: "1b" | "1c"; amount: number }
  /* The schedule stops with no credit and nothing to repay. */
  | { kind: "none"; why: string }
  | { kind: "waits"; on: "line2" | "line4" | "dependent" }
  | { kind: "gap"; reason: string };

export interface ScheduleAResult {
  reach: PartIReach;
  outcome: VehicleOutcome;
}

const none = (why: string, reach: PartIReach = 0): ScheduleAResult => ({
  reach,
  outcome: { kind: "none", why },
});
const gap = (reason: string, reach: PartIReach = 0): ScheduleAResult => ({
  reach,
  outcome: { kind: "gap", reason },
});
const waits = (on: "line2" | "line4" | "dependent", reach: PartIReach): ScheduleAResult => ({
  reach,
  outcome: { kind: "waits", on },
});

const transferred = (vehicle: CleanVehicleFactValue) =>
  typeof vehicle.creditTransferredToDealer === "number" && vehicle.creditTransferredToDealer > 0;

/* "Check the box on line 4b and report the amount from line 4a on Schedule 2" (lines 8a, 8d, 13a, 13c; irs-1040-inst-2025::sec::line-1b-2::b01). */
function repayOrNone(vehicle: CleanVehicleFactValue, why: string, reach: PartIReach) {
  if (!transferred(vehicle)) return none(why, reach);
  const schedule2Line = vehicle.kind === "new" ? "1b" : "1c";
  const amount = roundDollars(vehicle.creditTransferredToDealer ?? 0);
  return { reach, outcome: { kind: "repay", schedule2Line, amount } } as ScheduleAResult;
}

/* Lines 5–7: placed in service in 2025 and acquired before October 1, 2025 (after 2022 for lines 6 and 7). */
export function passesLines5To7(vehicle: CleanVehicleFactValue): boolean {
  const inYear = vehicle.placedInServiceDate.startsWith(TAX_YEAR_PREFIX);
  const early = vehicle.kind !== "new" && vehicle.acquiredDate < FIRST_ACQUIRED_DATE;
  return inYear && !early && vehicle.acquiredDate <= LAST_ACQUIRED_DATE;
}

/*
 * Lines 8c–8d or 13b–13c. "No" at either step: eligible, but a credit already
 * transferred "stop[s] here" — the dealer paid it at the time of sale. "Yes" at
 * both: no credit, and a transferred credit is repaid.
 */
function magiTest(
  vehicle: CleanVehicleFactValue,
  chart: LimitChart,
  magi: MagiAnswers,
): ScheduleAResult | "eligible" {
  if (magi.line2 === undefined || magi.status2025 === undefined) return waits("line2", 1);
  if (!overMagiLimit(magi.line2, chart, magi.status2025)) {
    return transferred(vehicle) ? none("credit transferred; eligible", 1) : "eligible";
  }
  if (magi.line4 === undefined || magi.status2024 === undefined) return waits("line4", 2);
  if (
    magi.status2025 === "married_filing_jointly" &&
    magi.status2024 !== "married_filing_jointly"
  ) {
    return gap(
      "A 2025 joint return whose 2024 return was not joint: lines 8d and 13c say 'See instructions if your 2025 return is a joint return', and the instructions do not say how (irs-8936-inst-2025::sec::lines-8c-and-8d::b01).",
      2,
    );
  }
  if (overMagiLimit(magi.line4, chart, magi.status2024)) {
    return repayOrNone(vehicle, "modified AGI over the limit for 2024 and 2025", 2);
  }
  return transferred(vehicle) ? none("credit transferred; eligible", 2) : "eligible";
}

/* Line 10: the percentage, times the months of business use over 12 when the use changed (line-10::b02). */
export function businessUsePercent(percent: number, months?: number): number {
  return months === undefined ? percent : (percent * months) / MONTHS_IN_YEAR;
}

/* Part II and Part III, lines 9–12. Line 12 only when line 10 is not 100%. */
export function newVehicleLines(tentativeCredit: number, percent: number): VehicleOutcome {
  const line9 = roundDollars(tentativeCredit);
  const line11 = roundDollars((line9 * percent) / 100);
  const line12 = percent >= 100 ? undefined : line9 - line11;
  return { kind: "new", line9, line10: percent, line11, line12 };
}

function newVehicle(vehicle: CleanVehicleFactValue, magi: MagiAnswers): ScheduleAResult {
  if (vehicle.resoldWithin30Days === undefined) return gap(missing("line 8a"));
  if (vehicle.resoldWithin30Days) return repayOrNone(vehicle, "resold within 30 days", 0);
  const test = magiTest(vehicle, "new", magi);
  if (test !== "eligible") return test;
  const reach = magi.line2 !== undefined && overNew(magi) ? 2 : 1;
  if (!vehicle.acquiredForUse) return none("not acquired for use", reach);
  if (vehicle.tentativeCredit === undefined || vehicle.businessUsePercent === undefined) {
    return gap(missing("lines 9 and 10"), reach);
  }
  const percent = businessUsePercent(vehicle.businessUsePercent, vehicle.businessUseMonths);
  return { reach, outcome: newVehicleLines(vehicle.tentativeCredit, percent) };
}

const overNew = (magi: MagiAnswers) =>
  magi.status2025 !== undefined && overMagiLimit(magi.line2 ?? 0, "new", magi.status2025);
const overUsed = (magi: MagiAnswers) =>
  magi.status2025 !== undefined &&
  overMagiLimit(magi.line2 ?? 0, "previously_owned", magi.status2025);

const missing = (lines: string) =>
  `The vehicle fact does not state Schedule A (Form 8936) ${lines}; Cade records it from the seller report or the taxpayer.`;

/* Part IV, lines 14–17: the smaller of 30% of the sales price and $4,000. */
export function previouslyOwnedLines(salesPrice: number): VehicleOutcome {
  const line14 = roundDollars(salesPrice);
  const line15 = roundDollars(line14 * PREVIOUSLY_OWNED_RATE);
  const line16 = PREVIOUSLY_OWNED_MAXIMUM;
  return { kind: "previously_owned", line14, line15, line16, line17: Math.min(line15, line16) };
}

function previouslyOwned(
  vehicle: CleanVehicleFactValue,
  magi: MagiAnswers,
  claimableAsDependent: boolean | undefined,
): ScheduleAResult {
  if (vehicle.resoldWithin30Days === undefined) return gap(missing("line 13a"));
  if (vehicle.resoldWithin30Days) return repayOrNone(vehicle, "resold within 30 days", 0);
  const test = magiTest(vehicle, "previously_owned", magi);
  if (test !== "eligible") return test;
  const reach = magi.line2 !== undefined && overUsed(magi) ? 2 : 1;
  const { claimedUsedCreditInPrior3Years: claimedBefore, salesPrice } = vehicle;
  if (claimedBefore === undefined || salesPrice === undefined) {
    return gap(missing("lines 13d and 14"), reach);
  }
  if (claimedBefore) return none("a previously owned credit in the 3 years before", reach);
  if (salesPrice > PREVIOUSLY_OWNED_PRICE_LIMIT) return none("sales price over $25,000", reach);
  if (!vehicle.acquiredForUse) return none("not acquired for use", reach);
  if (claimableAsDependent === undefined) return waits("dependent", reach);
  if (claimableAsDependent) return none("can be claimed as a dependent", reach);
  return { reach, outcome: previouslyOwnedLines(salesPrice) };
}

/* Part V, lines 19–26 (qualified-commercial-clean-vehicle::b01–b03; line-18d::b01; line-20::b01). */
export function commercialLines(inputs: {
  basis: number;
  section179Deduction?: number;
  poweredByGasOrDiesel: boolean;
  incrementalCost: number;
  grossVehicleWeightRating: number;
}): VehicleOutcome {
  const line19 = roundDollars(inputs.basis);
  const line20 =
    inputs.section179Deduction === undefined ? undefined : roundDollars(inputs.section179Deduction);
  const line21 = line19 - (line20 ?? 0);
  const rate = inputs.poweredByGasOrDiesel
    ? COMMERCIAL_RATE_WITH_ENGINE
    : COMMERCIAL_RATE_WITHOUT_ENGINE;
  const line22 = roundDollars(line21 * rate);
  const line23 = roundDollars(inputs.incrementalCost);
  const line24 = Math.min(line22, line23);
  const heavy = inputs.grossVehicleWeightRating >= HEAVY_VEHICLE_POUNDS;
  const line25 = heavy ? COMMERCIAL_MAXIMUM_HEAVY : COMMERCIAL_MAXIMUM;
  return {
    kind: "commercial",
    line19,
    line20,
    line21,
    line22,
    line23,
    line24,
    line25,
    line26: Math.min(line24, line25),
  };
}

function commercial(vehicle: CleanVehicleFactValue): ScheduleAResult {
  if (transferred(vehicle)) {
    return gap(
      "A qualified commercial clean vehicle with a credit transferred to the dealer: Schedule A has no transfer step in Part V.",
    );
  }
  if (vehicle.depreciable === undefined) return gap(missing("line 18b"));
  if (!vehicle.depreciable) return none("not of a character subject to depreciation");
  if (!vehicle.acquiredForUse) return none("not acquired for use");
  const { basis, poweredByGasOrDiesel, incrementalCost, grossVehicleWeightRating } = vehicle;
  if (
    basis === undefined ||
    poweredByGasOrDiesel === undefined ||
    incrementalCost === undefined ||
    grossVehicleWeightRating === undefined
  ) {
    return gap(missing("lines 18d, 18e, 19 and 23"));
  }
  const outcome = commercialLines({
    basis,
    section179Deduction: vehicle.section179Deduction,
    poweredByGasOrDiesel,
    incrementalCost,
    grossVehicleWeightRating,
  });
  return { reach: 0, outcome };
}

/* One vehicle's Schedule A. */
export function scheduleA(
  vehicle: CleanVehicleFactValue,
  magi: MagiAnswers,
  claimableAsDependent?: boolean,
): ScheduleAResult {
  if (!passesLines5To7(vehicle)) {
    return transferred(vehicle)
      ? gap(
          "A credit transferred to the dealer for a vehicle that lines 5–7 rule out (acquired after September 30, 2025, or not placed in service in 2025): Schedule A stops at line 7 and says nothing about repayment.",
        )
      : none("not described on line 5, 6 or 7");
  }
  if (vehicle.kind === "new") return newVehicle(vehicle, magi);
  if (vehicle.kind === "previously_owned") {
    return previouslyOwned(vehicle, magi, claimableAsDependent);
  }
  return commercial(vehicle);
}
