/*
 * A Schedule C business with box 32b checked: "Some investment is not at risk
 * ... complete Form 6198 to figure the loss to enter on line 31"
 * (irs-1040sc-inst-2025::sec::line-32::b03). Form 6198 line 1 is the business's
 * loss before the at-risk rules, line 29 less line 30: "your ordinary income or
 * loss from the at-risk activity without regard to the at-risk limitations"
 * (irs-6198-inst-2025::sec::line-1::b01; the Schedule C loss of the
 * ::line-5::b02 example). A loss carried from an earlier year is already in Part V
 * as a prior year loss (::part-i::b01), so line 1 includes it. Takes the line as
 * an argument, so schedule-c/lines.ts can read it with no circle of imports.
 */

import type { BusinessFactValue } from "../../facts/index.js";
import {
  dispositionEntries,
  figureForm6198,
  type AtRiskActivity,
  type Form6198Outcome,
} from "../6198/figure.js";

/* The one Part I item of a business: its loss on line 1, which line 31 takes the allowed part of. */
export const SCHEDULE_C_LOSS = "schedule_c_line_31";
type Source = typeof SCHEDULE_C_LOSS;

/* Form 6198 files for the business: box 32b with a loss on line 29 less line 30 (irs-1040sc-inst-2025::sec::line-32::b01). */
export function businessNeedsForm6198(
  business: BusinessFactValue,
  beforeAtRisk: number | undefined,
): boolean {
  return business.allInvestmentAtRisk === false && beforeAtRisk !== undefined && beforeAtRisk < 0;
}

/* The business's activity for Form 6198; factKey is the business fact, which holds atRisk. */
export function businessAtRiskActivity(
  business: BusinessFactValue,
  beforeAtRisk: number,
  factKey = "business",
): AtRiskActivity<Source> {
  const amounts = business.atRisk;
  return {
    factKey,
    title: `${business.name ?? business.activity} (Schedule C)`,
    description: amounts?.description ?? business.activity,
    entries: [
      { line: "1", amount: beforeAtRisk, source: SCHEDULE_C_LOSS },
      ...dispositionEntries<Source>(amounts),
    ],
    amounts,
    owner: business.owner ?? "taxpayer",
  };
}

export function figureBusinessForm6198(
  business: BusinessFactValue,
  beforeAtRisk: number,
  factKey?: string,
): Form6198Outcome<Source> {
  return figureForm6198(businessAtRiskActivity(business, beforeAtRisk, factKey));
}

/*
 * Line 31 for a business on Form 6198: the allowed part of the line 1 loss
 * (the ::line-5::b02 example: a $4,600 loss, a $3,100 gain and $600 allowed
 * over it give $3,700). Undefined while the form waits or cannot be figured.
 */
export function allowedBusinessLoss(
  business: BusinessFactValue,
  beforeAtRisk: number,
): number | undefined {
  const outcome = figureBusinessForm6198(business, beforeAtRisk);
  if (outcome.kind !== "figured") return undefined;
  return outcome.figures.entries.find((entry) => entry.source === SCHEDULE_C_LOSS)?.allowed;
}
