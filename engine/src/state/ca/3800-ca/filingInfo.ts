import type { ParentCaliforniaReturnFactValue, ParentFilingStatus } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

/* What the form reads beyond the child's own return, once every answer is in. */
export interface Form3800CaAnswers {
  /* The header: the parent named on the California fact, else on the federal Form 8615 fact. */
  parentName: string;
  parentSsn: string;
  /* The header and line 9: the California filing status, else the federal one. */
  parentFilingStatus: ParentFilingStatus;
  parent: ParentCaliforniaReturnFactValue;
  /* Line 2 for a child who itemizes on Form 540; undefined when not stated. */
  itemizedForUnearnedIncome?: number;
}

export interface Form3800CaFilingInfo extends BaseFilingInfo {
  /* Undefined while an answer is missing (the form's missingInputs lists it). */
  form3800CaAnswers?: Form3800CaAnswers;
  /* A case the engine does not handle for the whole form: every line is unsupported. */
  form3800CaGap?: string;
}
