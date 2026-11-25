/*
 * Who files Form 8938 (irs-8938-inst-2025::sec::who-must-file::b01): a
 * specified person with an interest in specified foreign financial assets
 * worth more than the reporting threshold, unless no income tax return is
 * required. A Form 1040 filer is a specified individual (specified-person::b02).
 */

import { FOREIGN_ASSET_KEYS, type ForeignFinancialAssetFact } from "../../facts/index.js";
import { num, type ResolverInputs } from "../../resolverInputs.js";
import { assetRate } from "./assetCurrency.js";
import {
  dollarsOf,
  reportingThreshold,
  thresholdOutcome,
  thresholdShare,
  thresholdTotals,
  type ThresholdOutcome,
} from "./lines.js";

export interface ThresholdTest {
  files: boolean;
  /* The answers the test waits for; while any waits the form files and asks. */
  waitsFor: string[];
  rule: string;
}

const bool = (inputs: ResolverInputs, key: string): boolean | undefined => {
  const value = inputs.factByKey.get(key);
  return typeof value === "boolean" ? value : undefined;
};

/*
 * Every asset counts toward the threshold, those reported on Form 3520, 3520-A,
 * 5471, 8621 or 8865 too (irs-8938-inst-2025::sec::special-rules::b01).
 */
function outcomeFor(
  assets: ReadonlyArray<ForeignFinancialAssetFact>,
  jointReturn: boolean,
  livesAbroad: boolean,
  spouseIsSpecifiedIndividual: boolean,
  highestTotalValue: number | undefined,
): ThresholdOutcome {
  const counted = assets.map(({ value }) => ({
    share: thresholdShare(value.owner, jointReturn, spouseIsSpecifiedIndividual) ?? 1,
    maximumDollars: dollarsOf(value.maximumValue, assetRate(value)),
    yearEndDollars: dollarsOf(value.yearEndValue, assetRate(value)),
  }));
  const threshold = reportingThreshold(jointReturn, livesAbroad);
  return thresholdOutcome(thresholdTotals(counted), threshold, highestTotalValue);
}

/* The values an unknown answer can take: both, when it is not stated. */
const choices = (stated: boolean | undefined): boolean[] =>
  stated === undefined ? [false, true] : [stated];

/* An answer waits when it is not stated and changing it changes the outcome. */
function matters(outcomes: ThresholdOutcome[][], byRow: boolean): boolean {
  if (byRow) return outcomes.some((row) => new Set(row).size > 1);
  const columns = outcomes[0].map((_, index) => outcomes.map((row) => row[index]));
  return columns.some((column) => new Set(column).size > 1);
}

export function thresholdTest(
  inputs: ResolverInputs,
  assets: ReadonlyArray<ForeignFinancialAssetFact>,
  jointReturn: boolean,
): ThresholdTest {
  if (assets.length === 0) return { files: false, waitsFor: [], rule: "no foreign asset" };
  const livesAbroad = bool(inputs, FOREIGN_ASSET_KEYS.livesAbroad);
  const needsSpouse =
    !jointReturn && assets.some((asset) => asset.value.owner === "joint_with_spouse");
  const spouse = bool(inputs, FOREIGN_ASSET_KEYS.spouseIsSpecifiedIndividual);
  const highest = num(inputs, FOREIGN_ASSET_KEYS.highestTotalValue);
  // Rows: lives abroad; columns: the spouse is a specified individual.
  const outcomes = choices(livesAbroad).map((abroad) =>
    choices(needsSpouse ? spouse : true).map((specified) =>
      outcomeFor(assets, jointReturn, abroad, specified, highest),
    ),
  );
  const all = outcomes.flat();
  const waitsFor = [
    ...(livesAbroad === undefined && matters(outcomes, false)
      ? [FOREIGN_ASSET_KEYS.livesAbroad]
      : []),
    ...(needsSpouse && spouse === undefined && matters(outcomes, true)
      ? [FOREIGN_ASSET_KEYS.spouseIsSpecifiedIndividual]
      : []),
    ...(all.includes("needs_highest_total") ? [FOREIGN_ASSET_KEYS.highestTotalValue] : []),
  ];
  if (waitsFor.length > 0) {
    return { files: true, waitsFor, rule: `the threshold test waits for ${waitsFor.join(", ")}` };
  }
  const files = all[0] === "files";
  return {
    files,
    waitsFor,
    rule: `${assets.length} foreign asset(s) ${files ? "over" : "not over"} the threshold`,
  };
}
