/*
 * FTB 3885A for one activity: California depreciation and amortization from the
 * activity's answers, against the federal Form 4562 amounts. California takes no
 * special depreciation allowance (ca-3885a-inst-2025::sec::b-federal-state-differences::b03,
 * "Additional depreciation (IRC Section 168(k))") and otherwise uses the same
 * MACRS rate (federal/4562/assets.ts) on the California basis. Each line is
 * rounded; a total adds the rounded lines.
 */

import type {
  ActivityDepreciation,
  AmortizedCost,
  DepreciableAsset,
} from "../../../facts/index.js";
import { businessBasis, firstYearDepreciation } from "../../../federal/4562/assets.js";
import {
  activityDepreciation,
  amortizationExact,
  amortizationThisYear,
  form4562Figures,
  line44,
} from "../../../federal/4562/lines.js";
import { roundDollars, sum, sumOrBlank } from "../../../money.js";

/* ca-3885a-inst-2025::sec::tangible-property-expense-worksheet::b01: line 11, the business income limitation. */
export const CA_SECTION_179_GAP =
  "The California section 179 expense (Tangible Property Expense Worksheet line 11, the business income limitation) is not modeled.";

/* The form has four rows on line 3 and on line 9; more need an attached statement. */
export const TABLE_ROWS = 4;

export interface CaliforniaAssetRow {
  asset: DepreciableAsset;
  /* Column (c): the California basis, less a California section 179 expense. */
  basis: number;
  /* Column (f). */
  depreciation: number;
}

export interface CaliforniaAmortizationRow {
  cost: AmortizedCost;
  basis: number;
  amortization: number;
}

export interface Form3885AFigures {
  gap?: string;
  line3: CaliforniaAssetRow[];
  line4: number | undefined;
  line5: number | undefined;
  line6: number | undefined;
  line7: number | undefined;
  /* Line 8a (California more) or 8b (California less); undefined when they are equal or a line waits. */
  line8a: number | undefined;
  line8b: number | undefined;
  line9: CaliforniaAmortizationRow[];
  line10: number | undefined;
  line11: number | undefined;
  line12: number | undefined;
  line13: number | undefined;
  line14a: number | undefined;
  line14b: number | undefined;
}

/* ::line-3::b01: the California basis is cost less the California section 179 expense. */
function californiaAssetRow(asset: DepreciableAsset): CaliforniaAssetRow {
  const basis = roundDollars(
    (asset.californiaBasis ?? businessBasis(asset)) - (asset.californiaSection179Elected ?? 0),
  );
  // The same rounding rule as Form 4562 column (g), on the California basis.
  return { asset, basis, depreciation: firstYearDepreciation(asset, basis) };
}

/*
 * ::line-9::b01: the California basis and recovery period. No fact gives a
 * California period apart from the federal one, so a cost whose California
 * period differs is recorded with its California amount only for the year.
 */
function californiaAmortizationRow(cost: AmortizedCost): CaliforniaAmortizationRow {
  const amount = californiaAmortizable(cost);
  // Column (c) prints rounded; column (f) takes the year's share of the amount with its cents.
  return { cost, basis: roundDollars(amount), amortization: amortizationThisYear(cost, amount) };
}

/* The California amortizable amount, cents kept: the stated California amount, else the federal one. */
const californiaAmortizable = (cost: AmortizedCost) => cost.californiaAmount ?? cost.amount;

function gapOf(depreciation: ActivityDepreciation): string | undefined {
  // Line 7 and line 13 read Form 4562; its gap is this form's too.
  const federal = form4562Figures(depreciation).gap;
  if (federal) return federal;
  const assets = depreciation.assets ?? [];
  return assets.some((asset) => (asset.californiaSection179Elected ?? 0) > 0)
    ? CA_SECTION_179_GAP
    : undefined;
}

/* Line 8a or 8b (14a or 14b): the difference, by which side is larger. */
function difference(california: number | undefined, federal: number | undefined) {
  if (california === undefined || federal === undefined)
    return { more: undefined, less: undefined };
  return {
    more: california > federal ? california - federal : undefined,
    less: california < federal ? federal - california : undefined,
  };
}

/* Parts II–IV for one activity. Part II (line 2) is blank: a California section 179 expense is a gap. */
export function form3885AFigures(depreciation: ActivityDepreciation): Form3885AFigures {
  const gap = gapOf(depreciation);
  const line3 = (depreciation.assets ?? []).map(californiaAssetRow);
  const line4 = sumOrBlank(...line3.map((row) => row.depreciation));
  const line5 = roundDollars(
    depreciation.californiaPriorYearDepreciation ?? depreciation.priorYearMacrs,
  );
  const line6 = gap ? undefined : sumOrBlank(line4, line5);
  // Line 7 waits with Form 4562; with nothing on Form 4562 line 22 the federal amount is 0.
  const federal = activityDepreciation(undefined, depreciation);
  const line7 =
    federal.kind !== "amount"
      ? undefined
      : (federal.amount ?? (line6 === undefined ? undefined : 0));
  const depreciationDifference = difference(line6, line7);
  const line9 = (depreciation.amortizedCosts ?? []).map(californiaAmortizationRow);
  /*
   * Lines 10 and 12 add with cents and round once, as Form 4562 line 44 does
   * (irs-1040-inst-2025::sec::rounding-off-to-whole::b01), so equal federal and
   * California amounts give equal totals.
   */
  const exact = line9.map((row) => amortizationExact(row.cost, californiaAmortizable(row.cost)));
  const priorAmortization =
    depreciation.californiaPriorYearAmortization ?? depreciation.priorYearAmortization;
  const line10 = line9.length === 0 ? undefined : roundDollars(sum(...exact));
  const line11 = roundDollars(priorAmortization);
  const line12 =
    line10 === undefined && line11 === undefined
      ? undefined
      : roundDollars(sum(...exact, priorAmortization));
  // With no federal amortization, line 13 is 0 against California's.
  const line13 = line44(depreciation) ?? (line12 === undefined ? undefined : 0);
  const amortizationDifference = difference(line12, line13);
  return {
    gap,
    line3,
    line4,
    line5,
    line6,
    line7,
    line8a: depreciationDifference.more,
    line8b: depreciationDifference.less,
    line9,
    line10,
    line11,
    line12,
    line13,
    line14a: amortizationDifference.more,
    line14b: amortizationDifference.less,
  };
}

/*
 * The California adjustment for the activity's Schedule CA line (3 or 5): column
 * B takes lines 8a and 14a, column C lines 8b and 14b
 * (ca-3885a-inst-2025::sec::line-8a-and-line-8b::b01, ::line-14a-and-line-14b::b01).
 * Undefined while a line waits or the activity has a gap.
 */
export function californiaAdjustment(depreciation: ActivityDepreciation | undefined) {
  if (!depreciation) return { subtraction: 0, addition: 0 };
  const figures = form3885AFigures(depreciation);
  if (figures.gap) return undefined;
  // A line that has a California amount but waits for the federal one waits too.
  const waits =
    (figures.line6 !== undefined && figures.line7 === undefined) ||
    (figures.line12 !== undefined && figures.line13 === undefined);
  if (waits) return undefined;
  return {
    subtraction: sum(figures.line8a, figures.line14a),
    addition: sum(figures.line8b, figures.line14b),
  };
}

/* ::specific-line-instructions::b01: a separate form for each activity with a difference. */
export function mustFile3885A(depreciation: ActivityDepreciation | undefined): boolean {
  if (!depreciation) return false;
  const figures = form3885AFigures(depreciation);
  return [figures.line8a, figures.line8b, figures.line14a, figures.line14b].some(
    (amount) => (amount ?? 0) > 0,
  );
}
