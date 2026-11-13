/*
 * First-year depreciation of one asset placed in service in 2025 (Form 4562
 * Parts I–III). Amounts keep their cents; the form's lines round them.
 * California uses the same MACRS rules with its own basis and no special
 * allowance (state/ca/3885a), so the rate functions take the basis as input.
 */

import type { DepreciableAsset, DepreciationConvention, RecoveryClass } from "../../facts/index.js";
import { stepsOf } from "../../money.js";

/*
 * irs-4562-inst-2025::sec::recovery-period-for-most-property::b01: the recovery
 * period of each class.
 */
export const RECOVERY_YEARS: Record<RecoveryClass, number> = {
  "3_year": 3,
  "5_year": 5,
  "7_year": 7,
  "10_year": 10,
  "15_year": 15,
  "20_year": 20,
  "25_year": 25,
  residential_rental: 27.5,
  nonresidential_real: 39,
  "50_year": 50,
};

/* ::b02–b03: the mid-month convention is for real property and railroad gradings; the others use HY or MQ. */
const MID_MONTH_CLASSES: readonly RecoveryClass[] = [
  "residential_rental",
  "nonresidential_real",
  "50_year",
];

/* ::b05: water utility, residential rental, nonresidential real and railroad gradings take straight line only. */
const STRAIGHT_LINE_CLASSES: readonly RecoveryClass[] = [
  "25_year",
  "residential_rental",
  "nonresidential_real",
  "50_year",
];

/* ::b04–b05: 150% DB is for 15- and 20-year property, or by election for 3- to 10-year property. */
const DECLINING_BALANCE_FACTOR = { "200DB": 2, "150DB": 1.5 } as const;
const NO_200DB_CLASSES: readonly RecoveryClass[] = ["15_year", "20_year"];

/* ::b07: the Step 3 decimal for the half-year and mid-quarter conventions. */
const HALF_YEAR = 0.5;
const MID_QUARTER_PLACED_IN_SERVICE = [0.875, 0.625, 0.375, 0.125];
const MONTHS = 12;
const MONTHS_PER_QUARTER = 3;
const MID_MONTH_OFFSET = 0.5;

/* irs-4562-inst-2025::sec::line-14::b02: qualified property has a recovery period of 20 years or less, or is water utility property. */
const SPECIAL_ALLOWANCE_MAX_YEARS = 25;
/* ::b02–b03: 100% for property acquired after January 19, 2025; 40% for earlier property or by election. */
export const SPECIAL_ALLOWANCE_FULL = 1;
export const SPECIAL_ALLOWANCE_PHASED_DOWN = 0.4;
/* The first day an asset can have been acquired after January 19, 2025. */
const FULL_ALLOWANCE_FROM = "2025-01-20";
const TAX_YEAR_PREFIX = "2025-";

const monthOf = (date: string): number => Number(date.split("-")[1]);

/* Why the engine does not figure this asset, or undefined when it does. */
export function assetGap(asset: DepreciableAsset): string | undefined {
  if (asset.listedProperty)
    return "Listed property (Part V, line 26 or 27) is not modeled: no fact gives its use by year or the vehicle answers.";
  if (!asset.placedInService.startsWith(TAX_YEAR_PREFIX))
    return "An asset in the assets list was not placed in service in 2025; older assets belong in the line 17 amount.";
  const midMonth = MID_MONTH_CLASSES.includes(asset.recoveryClass);
  if (midMonth !== (asset.convention === "MM"))
    return "The convention does not fit the class: mid-month is for real property and railroad gradings only (Form 4562 column (e)).";
  if (asset.method !== "SL" && STRAIGHT_LINE_CLASSES.includes(asset.recoveryClass))
    return "This class takes the straight line method only (Form 4562 column (f)).";
  if (asset.method === "200DB" && NO_200DB_CLASSES.includes(asset.recoveryClass))
    return "15- and 20-year property takes 150% declining balance or straight line, not 200% (Form 4562 column (f)).";
  return undefined;
}

/* Column (c) before any deduction: the cost times the business or investment use. */
export function businessBasis(asset: DepreciableAsset): number {
  return (asset.cost * (asset.businessUsePercent ?? 100)) / 100;
}

/*
 * The special allowance rate (line 14), or undefined while the answer it needs
 * is missing: an asset placed in service after January 19 needs whether it was
 * acquired after that date.
 */
export function specialAllowanceRate(asset: DepreciableAsset): number | undefined {
  if (asset.electedOutOfSpecialAllowance) return 0;
  if (RECOVERY_YEARS[asset.recoveryClass] > SPECIAL_ALLOWANCE_MAX_YEARS) return 0;
  if (asset.placedInService < FULL_ALLOWANCE_FROM) return SPECIAL_ALLOWANCE_PHASED_DOWN;
  if (asset.acquiredAfterJanuary19 === undefined) return undefined;
  if (!asset.acquiredAfterJanuary19 || asset.elected40PercentAllowance)
    return SPECIAL_ALLOWANCE_PHASED_DOWN;
  return SPECIAL_ALLOWANCE_FULL;
}

/* irs-4562-inst-2025::sec::recovery-period-for-most-property::b07: the placed-in-service decimal. */
export function conventionDecimal(convention: DepreciationConvention, placedInService: string) {
  const month = monthOf(placedInService);
  if (convention === "HY") return HALF_YEAR;
  if (convention === "MQ")
    return MID_QUARTER_PLACED_IN_SERVICE[stepsOf(month, MONTHS_PER_QUARTER) - 1] ?? 0;
  return (MONTHS - month + MID_MONTH_OFFSET) / MONTHS;
}

/*
 * ::b06–b07: Step 1 rate (the declining balance factor, or 1.00, over the
 * recovery period; a first year has the whole period left), times the Step 3
 * decimal. In a first year the declining balance rate is always the larger.
 */
export function firstYearRate(asset: DepreciableAsset): number {
  const years = RECOVERY_YEARS[asset.recoveryClass];
  const factor = asset.method === "SL" ? 1 : DECLINING_BALANCE_FACTOR[asset.method];
  return (factor / years) * conventionDecimal(asset.convention, asset.placedInService);
}

export interface FederalAssetFigures {
  asset: DepreciableAsset;
  /* Line 6 column (b): the business-use cost. */
  cost: number;
  /* Line 6 column (c). */
  section179: number;
  /* Line 14's share; undefined while the acquisition answer is missing. */
  specialAllowance: number | undefined;
  /* Line 19 column (c): the basis left after section 179 and the special allowance. */
  macrsBasis: number | undefined;
  /* Line 19 column (g)'s share. */
  depreciation: number | undefined;
}

/*
 * irs-4562-inst-2025::sec::line-14::b10 and ::section-b::b08–b09: the special
 * allowance is figured after section 179, and both come off the basis for
 * depreciation.
 */
export function federalAssetFigures(asset: DepreciableAsset): FederalAssetFigures {
  const cost = businessBasis(asset);
  const section179 = asset.section179Elected ?? 0;
  const rate = specialAllowanceRate(asset);
  const specialAllowance = rate === undefined ? undefined : (cost - section179) * rate;
  const macrsBasis =
    specialAllowance === undefined ? undefined : cost - section179 - specialAllowance;
  return {
    asset,
    cost,
    section179,
    specialAllowance,
    macrsBasis,
    depreciation: macrsBasis === undefined ? undefined : macrsBasis * firstYearRate(asset),
  };
}
