/*
 * Form 1040 lines 5a and 5b with a Form 4972 (irs-4972-form-2025::sec::how-to-report-the-distribution::b02):
 * "2. If you don't use Part III of Form 4972, but use Part II, report only the
 * ordinary income portion of the distribution on Form 1040 ... lines 5a and 5b
 * ... The ordinary income portion is the amount from box 2a of Form 1099-R,
 * minus the amount from box 3 of that form. 3. If you use Part III of Form
 * 4972, don't include any part of the distribution on Form 1040 ... lines 5a and 5b".
 */

import type { RetirementDistributionFactValue } from "../../facts/index.js";
import { sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { choicesOf, form4972Copies } from "./copies.js";
import type { Form4972Copy } from "./filingInfo.js";
import { resolve4972Info } from "./resolveInfo.js";

const GAP_PART_II_EXCLUSION =
  "Form 4972 Part II without Part III and a death benefit exclusion: the instructions do not say where the rest of the exclusion (Death Benefit Worksheet line D − line E) goes when Part III is not used (irs-4972-form-2025::sec::line-6::b01).";

export interface PensionRowsAfterForm4972 {
  rows: RetirementDistributionFactValue[];
  /* Why lines 5a and 5b cannot be figured. */
  gap?: string;
}

const rowsOfCopy = (inputs: ResolverInputs, copy: Form4972Copy) =>
  copy.answers.distributionKeys.flatMap(
    (key) => (inputs.factByKey.get(key) as RetirementDistributionFactValue | undefined) ?? [],
  );

/* NUA Worksheet line F: ordinary income on line 5b when Part II goes alone (QUESTIONS.md). */
const nuaOrdinaryOf = (copy: Form4972Copy) =>
  copy.result.kind === "figured" ? (copy.result.lines.nua?.lineF ?? 0) : 0;

/*
 * A Part II-only row: box 1 and box 2a less box 3. Line 5a is the gross less box
 * 3 too (QUESTIONS.md: the text names only the ordinary income portion). Box 1
 * already holds the securities' value, so the NUA part adds to box 2a only.
 */
function ordinaryPart(
  row: RetirementDistributionFactValue,
  nuaOrdinary: number,
): RetirementDistributionFactValue {
  return {
    ...row,
    box1: sum(row.box1, -sum(row.box3)),
    box2a: sum(row.box2a, -sum(row.box3), nuaOrdinary),
  };
}

/* The rows that stay on lines 5a and 5b, as they count there. */
export function pensionRowsAfterForm4972(
  inputs: ResolverInputs,
  rows: RetirementDistributionFactValue[],
): PensionRowsAfterForm4972 {
  if (resolve4972Info(inputs).mustFile?.["form-4972"]?.value !== true) return { rows };
  const copies = form4972Copies(inputs);
  const tenYear = new Set(
    copies.filter((copy) => copy.answers.tenYearOption).flatMap((copy) => rowsOfCopy(inputs, copy)),
  );
  const partIIOnly = copies.filter((copy) => !copy.answers.tenYearOption);
  const replaced = new Map(
    partIIOnly.flatMap((copy) =>
      rowsOfCopy(inputs, copy).map(
        (row, index) => [row, ordinaryPart(row, index === 0 ? nuaOrdinaryOf(copy) : 0)] as const,
      ),
    ),
  );
  const gapCopy = partIIOnly.find((copy) => copy.result.kind === "gap");
  const withExclusion = partIIOnly.some(
    (copy) => choicesOf(copy.answers).deathBenefitExclusion > 0,
  );
  return {
    rows: rows.filter((row) => !tenYear.has(row)).map((row) => replaced.get(row) ?? row),
    gap:
      gapCopy?.result.kind === "gap"
        ? gapCopy.result.reason
        : withExclusion
          ? GAP_PART_II_EXCLUSION
          : undefined,
  };
}
