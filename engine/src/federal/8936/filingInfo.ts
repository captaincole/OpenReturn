import type {
  CleanVehicleFact,
  CleanVehicleK1Credits,
  CleanVehiclePriorYearAdditions,
} from "../../facts/index.js";
import type { FilingStatus } from "../../values.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";

/* The answers for the whole return that Form 8936 reads, as stated. */
export interface CleanVehicleAnswers {
  /* Line 3a: the 2024 Form 1040 line 11 (PRIOR_YEAR_KEYS.federalAgi). */
  agi2024?: number;
  /* Line 5; undefined when it is not one of the five statuses. */
  status2024?: FilingStatus;
  additions2024?: CleanVehiclePriorYearAdditions;
  /* Line 1b. */
  puertoRicoExcluded2025?: number;
  /* Schedule A line 13g. */
  claimableAsDependent?: boolean;
  /* Lines 7 and 20. */
  k1Credits?: CleanVehicleK1Credits;
}

/*
 * Line 11 and line 16 read Schedule 3 line 4 (Form 8880) and tell its gap from
 * "no credit" with Form 8880's slots.
 */
export interface Form8936FilingInfo extends Form8880FilingInfo {
  /* The vehicles placed in service in 2025, one Schedule A each; undefined when the form does not file. */
  cleanVehicles?: CleanVehicleFact[];
  cleanVehicleAnswers?: CleanVehicleAnswers;
}
