import type { EnergyImprovementItem } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form5695FilingInfo extends BaseFilingInfo {
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
