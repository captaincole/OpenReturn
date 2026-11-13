/*
 * Form 4562 for one activity (a business or a rental) from its depreciation
 * answers, for the forms that read it before Form 4562 is evaluated: Schedule C
 * line 13 and Part V, Schedule E line 18, FTB 3885A line 7 and line 13. Each line
 * is rounded, and a total adds the rounded lines.
 */

import type {
  ActivityDepreciation,
  AmortizedCost,
  DepreciableAsset,
  RecoveryClass,
} from "../../facts/index.js";
import { roundDollars, sum, sumOrBlank } from "../../money.js";
import { assetGap, federalAssetFigures, type FederalAssetFigures } from "./assets.js";

/* irs-4562-inst-2025::sec::line-11::b01: the business income limitation needs every active trade's taxable income. */
export const SECTION_179_GAP =
  "The section 179 business income limitation (line 11) is not modeled: it needs the taxable income from every trade or business actively conducted.";

/* Lines 19a–19j: one row per class; 19i and 19j have a row for each month placed in service. */
export const LINE_19_ROWS: Record<RecoveryClass, string> = {
  "3_year": "19a",
  "5_year": "19b",
  "7_year": "19c",
  "10_year": "19d",
  "15_year": "19e",
  "20_year": "19f",
  "25_year": "19g",
  "50_year": "19h",
  residential_rental: "19i",
  nonresidential_real: "19j",
};

export interface Line19Row {
  row: string;
  assets: FederalAssetFigures[];
  /* Column (c), rounded; undefined while an asset waits. */
  basis: number | undefined;
  /* Column (g), rounded. */
  deduction: number | undefined;
}

export interface Form4562Figures {
  /* Why the engine does not figure line 22 for this activity, or undefined. */
  gap?: string;
  assets: FederalAssetFigures[];
  line14: number | undefined;
  line17: number | undefined;
  line19: Line19Row[];
  /* Line 22: blank when nothing adds to it, and undefined while an answer is missing or the activity has a gap. */
  line22: number | undefined;
  /* An asset waits for the acquisition answer (line 14): line 22 is not known yet. */
  waits: boolean;
}

const MONTHS = 12;
const amortizationMonth = (cost: AmortizedCost) => Number(cost.beginsOn.split("-")[1]);

/*
 * Who Must File (irs-4562-inst-2025::sec::who-must-file::b01): depreciation of
 * property placed in service in 2025, a section 179 deduction or carryover,
 * listed property, or amortization that begins in 2025.
 */
export function mustFile4562(depreciation: ActivityDepreciation | undefined): boolean {
  if (!depreciation) return false;
  return (
    (depreciation.assets?.length ?? 0) > 0 ||
    (depreciation.section179Carryover ?? 0) > 0 ||
    (depreciation.amortizedCosts?.length ?? 0) > 0
  );
}

const TAX_YEAR = "2025-";
/* irs-4562-inst-2025::sec::recovery-period-for-most-property::b02: the mid-quarter test. */
const MID_QUARTER_SHARE = 0.4;
const LAST_QUARTER_START = "2025-10-01";

/*
 * The mid-quarter test: when the depreciable bases (before the special
 * allowance) of property placed in service in October–December are more than
 * 40% of the year's, the mid-quarter convention applies to all of it; else the
 * half-year convention. Real property is left out. The engine checks the
 * activity's own assets only (the test is the whole return's), and returns the
 * reason when a stated convention disagrees.
 */
function conventionGap(assets: DepreciableAsset[]): string | undefined {
  const personal = assets.filter((asset) => asset.convention !== "MM");
  if (personal.length === 0) return undefined;
  const basis = (asset: DepreciableAsset) =>
    federalAssetFigures(asset).cost - federalAssetFigures(asset).section179;
  const total = sum(...personal.map(basis));
  const late = sum(
    ...personal.filter((asset) => asset.placedInService >= LAST_QUARTER_START).map(basis),
  );
  const expected = total > 0 && late > MID_QUARTER_SHARE * total ? "MQ" : "HY";
  return personal.some((asset) => asset.convention !== expected)
    ? `The stated convention does not follow the mid-quarter test: ${expected} applies to this year's property (irs-4562-inst-2025::sec::recovery-period-for-most-property::b02).`
    : undefined;
}

/* Why the activity's line 22 is a case the engine does not handle. */
function activityGap(depreciation: ActivityDepreciation): string | undefined {
  const assets = depreciation.assets ?? [];
  const assetReason = assets.map(assetGap).find((reason) => reason !== undefined);
  if (assetReason) return assetReason;
  const conventionReason = conventionGap(assets);
  if (conventionReason) return conventionReason;
  if ((depreciation.amortizedCosts ?? []).some((cost) => !cost.beginsOn.startsWith(TAX_YEAR)))
    return "A cost listed as beginning amortization in 2025 began in another year; older amortization belongs in the line 43 amount.";
  const section179 =
    (depreciation.section179Carryover ?? 0) > 0 ||
    assets.some((asset) => (asset.section179Elected ?? 0) > 0);
  return section179 ? SECTION_179_GAP : undefined;
}

/* The rows of lines 19a–19j, in the form's order; an asset's month decides its 19i or 19j row. */
function line19Rows(assets: FederalAssetFigures[]): Line19Row[] {
  const groups = new Map<string, FederalAssetFigures[]>();
  for (const figures of assets) {
    const row = LINE_19_ROWS[figures.asset.recoveryClass];
    groups.set(row, [...(groups.get(row) ?? []), figures]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([row, members]) => {
      const waits = members.some((member) => member.macrsBasis === undefined);
      return {
        row,
        assets: members,
        basis: waits ? undefined : roundDollars(sum(...members.map((member) => member.macrsBasis))),
        // Each asset's deduction is already rounded (assets.ts firstYearDepreciation).
        deduction: waits ? undefined : sum(...members.map((member) => member.depreciation)),
      };
    });
}

/* Part II–IV for one activity. Lines 15, 16, 20 and 21 are not modeled (no facts give them). */
export function form4562Figures(depreciation: ActivityDepreciation): Form4562Figures {
  const assets = (depreciation.assets ?? []).map(federalAssetFigures);
  const gap = activityGap(depreciation);
  const waits = assets.some((figures) => figures.specialAllowance === undefined);
  const line14 = waits
    ? undefined
    : assets.some((figures) => (figures.specialAllowance ?? 0) > 0)
      ? roundDollars(sum(...assets.map((figures) => figures.specialAllowance)))
      : undefined;
  const line17 = roundDollars(depreciation.priorYearMacrs);
  const line19 = line19Rows(assets);
  const line22 =
    gap !== undefined || waits
      ? undefined
      : sumOrBlank(line14, line17, ...line19.map((row) => row.deduction));
  return { gap, assets, line14, line17, line19, line22, waits };
}

/* Line 42 column (f), cents kept: the amount over the period, times the months of the period in 2025. */
export function amortizationExact(cost: AmortizedCost, amount = cost.amount): number {
  const monthsIn2025 = Math.min(cost.periodMonths, MONTHS - amortizationMonth(cost) + 1);
  return (amount / cost.periodMonths) * monthsIn2025;
}

/* Line 42 column (f) as printed: rounded to the dollar. */
export function amortizationThisYear(cost: AmortizedCost, amount = cost.amount): number {
  return roundDollars(amortizationExact(cost, amount));
}

/*
 * Line 44: line 42 column (f) plus line 43. Column (f) follows
 * irs-4562-inst-2025::sec::line-42 ("Dividing the amount in column (c) by the
 * number of months over which the costs are to be amortized and multiplying the
 * result by the number of months in the amortization period included in your
 * tax year"). The total adds the column with its cents and rounds once:
 * "If you have to add two or more amounts to figure the amount to enter on a
 * line, include cents when adding the amounts and round off only the total"
 * (irs-1040-inst-2025::sec::rounding-off-to-whole::b01). Undefined when the
 * activity amortizes nothing.
 */
export function line44(depreciation: ActivityDepreciation | undefined): number | undefined {
  const costs = depreciation?.amortizedCosts ?? [];
  const prior = depreciation?.priorYearAmortization;
  if (costs.length === 0 && prior === undefined) return undefined;
  return roundDollars(sum(...costs.map((cost) => amortizationExact(cost)), prior));
}

/*
 * Whether the activity's depreciation is not known yet: an asset waits for an
 * answer, or Form 4562 has a gap. A form that reads it waits (or carries the
 * gap) only then; a blank deduction (nothing to depreciate) is 0 to a total.
 */
export function depreciationPending(depreciation: ActivityDepreciation | undefined): boolean {
  if (!depreciation || !mustFile4562(depreciation)) return false;
  const figures = form4562Figures(depreciation);
  return figures.waits || figures.gap !== undefined;
}

/* The depreciation deduction of an activity: line 22 when Form 4562 is filed, else the older assets' amount. */
export function activityDepreciationDeduction(
  depreciation: ActivityDepreciation | undefined,
): number | undefined {
  if (!depreciation) return undefined;
  if (mustFile4562(depreciation)) return form4562Figures(depreciation).line22;
  return roundDollars(depreciation.priorYearMacrs);
}

/* Assets still waiting for the acquisition-date answer (the line 14 rate). */
export function assetsAwaitingAnswers(depreciation: ActivityDepreciation | undefined) {
  return (depreciation?.assets ?? []).filter(
    (asset: DepreciableAsset) => federalAssetFigures(asset).specialAllowance === undefined,
  );
}
