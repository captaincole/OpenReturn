/*
 * Form5695FilingInfo — Form 5695 (Residential Energy Credits) slots
 * layered on top of BaseFilingInfo. resolveInfo.ts fills them from the
 * energy invoice facts and the four home answers
 * (facts/kinds/homeEnergy.ts).
 */

import type { EnergyImprovementItem } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form5695FilingInfo extends BaseFilingInfo {
  /** Every item on every energy invoice. */
  energyItems?: readonly EnergyImprovementItem[];
  /** Lines 17a and 21a. */
  homeEnergyMainHomeInUs?: boolean;
  /** Lines 17b and 21b. */
  homeEnergyOriginalUser?: boolean;
  /** Line 17c. */
  homeEnergyLastsFiveYears?: boolean;
  /** Line 17e. */
  homeEnergyNewConstruction?: boolean;
}
