/*
 * A farm with box 36b checked: "Some investment isn't at risk ... complete
 * Form 6198 to determine the amount of your loss"
 * (irs-1040sf-inst-2025::sec::line-36::b02). Form 6198 line 1 is the farm's
 * loss before the at-risk rules, line 9 less line 33: "your ordinary income or
 * loss from the at-risk activity without regard to the at-risk limitations"
 * (irs-6198-inst-2025::sec::line-1::b01). A loss carried from an earlier year
 * is already on line 32 as an other expense
 * (irs-1040sf-inst-2025::sec::line-30::b01, "At-risk loss deduction"), so line
 * 1 includes it. The same Form 6198 code as a Schedule C business.
 */

import type { FarmFactValue } from "../../facts/index.js";
import {
  dispositionEntries,
  figureForm6198,
  type AtRiskActivity,
  type Form6198Outcome,
} from "../6198/figure.js";

/* The one Part I item of a farm: its loss on line 1, which line 34 takes the allowed part of. */
export const SCHEDULE_F_LOSS = "schedule_f_line_34";
type Source = typeof SCHEDULE_F_LOSS;

/* Form 6198 files for the farm: box 36b with a loss before the at-risk rules. */
export function farmNeedsForm6198(farm: FarmFactValue, beforeAtRisk: number | undefined): boolean {
  return farm.allInvestmentAtRisk === false && beforeAtRisk !== undefined && beforeAtRisk < 0;
}

/* The farm's activity for Form 6198; factKey is the farm fact, which holds atRisk. */
export function farmAtRiskActivity(
  farm: FarmFactValue,
  beforeAtRisk: number,
  factKey = "farm",
): AtRiskActivity<Source> {
  const amounts = farm.atRisk;
  return {
    factKey,
    title: `${farm.activity} (Schedule F)`,
    description: amounts?.description ?? farm.activity,
    entries: [
      { line: "1", amount: beforeAtRisk, source: SCHEDULE_F_LOSS },
      ...dispositionEntries<Source>(amounts),
    ],
    amounts,
    owner: farm.owner ?? "taxpayer",
  };
}

export function figureFarmForm6198(
  farm: FarmFactValue,
  beforeAtRisk: number,
  factKey?: string,
): Form6198Outcome<Source> {
  return figureForm6198(farmAtRiskActivity(farm, beforeAtRisk, factKey));
}
