import type { AdoptionChildFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";

/* Whether a part of the form is filled: it applies, it is skipped, or it waits for an answer. */
export type PartState = "applies" | "skipped" | "waits";

/* One child of line 1, with the per-child inputs of Parts II and III. */
export interface AdoptionChildRow {
  factKey: string;
  child: AdoptionChildFactValue;
  line2: number;
  line3: number;
  /* A Form 8839 was filed for this child in a prior year (the line 3 Yes box). */
  priorCreditFiled: boolean;
  line5: number;
  line19: number;
  line20: number;
  /* Employer benefits were received for this child in a prior year (the line 20 Yes box). */
  priorBenefitsFiled: boolean;
  line22: number;
  /* Line 24 takes line 21; undefined while the employer-program answer is missing. */
  takesLine21: boolean | undefined;
}

export interface Form8839FilingInfo extends BaseFilingInfo {
  // Line 1: one row per adoption child fact, in fact order.
  adoptionChildren?: AdoptionChildRow[];
  // Line 15: the carryforward from prior years; undefined while the answer is missing.
  adoptionCarryforward?: number;
  // Parts II and III: filled, skipped, or waiting.
  adoptionPartII?: PartState;
  adoptionPartIII?: PartState;
  // A case the engine does not handle, for the whole form or for Part III only.
  adoptionGap?: string;
  adoptionPartIIIGap?: string;
}
