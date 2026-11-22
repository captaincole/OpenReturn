import type { ParentReturnFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { PreferentialParts } from "./lines.js";

/* What the form reads beyond the child's own return, once every answer is in. */
export interface Form8615Answers {
  parent: ParentReturnFactValue;
  /* Line 7 and its parts; undefined when no other child uses the parent's return. */
  otherChildren?: PreferentialParts & { netUnearnedIncome: number };
  /* Line 2 and the Line 5 Worksheets, for a child who itemizes; 0 otherwise. */
  itemizedForUnearnedIncome: number;
  itemizedForDividendsAndGains: number;
}

export interface Form8615FilingInfo extends BaseFilingInfo {
  /* The child itemizes (Form 1040's resolver fills it from decisions.itemize_vs_standard). */
  useItemizedDeductions?: boolean;
  /* Undefined while an answer is missing (the form's missingInputs lists it). */
  form8615Answers?: Form8615Answers;
  /* The parent files Form 2555: Part II (lines 6 through 13) cannot be figured. */
  form8615ParentIncomeGap?: string;
  /* A case the engine does not handle for the tax on line 9 (the parent's or another child's return). */
  form8615Line9Gap?: string;
  /* A case the engine does not handle for the child's tax on lines 15 and 17. */
  form8615ChildTaxGap?: string;
  /* Someone can claim the child as a dependent: line 4 (Form 1040 line 15) cannot be figured. */
  form8615DependentGap?: string;
}
