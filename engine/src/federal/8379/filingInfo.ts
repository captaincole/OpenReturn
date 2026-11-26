import type { InjuredSpouseFactValue } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1040FilingInfo } from "../1040/filingInfo.js";

/* One spouse's amounts from the documents that name the spouse (W-2s, 1099-Rs, businesses). */
export interface Form8379Spouse {
  /* W-2 box 1 (Part III line 13a). */
  wages: number;
  /* W-2 box 2 (line 19). */
  w2Withholding: number;
  /* Form 1099-R box 4 (line 19). */
  retirementWithholding: number;
  /* W-2 box 6 and box 5, for this spouse's part of Form 8959 line 24 (line 19). */
  medicareTaxWithheld: number;
  medicareWages: number;
  /* Schedule 3 line 11 would hold this spouse's excess social security tax. */
  excessSocialSecurity: boolean;
  /* A Schedule C business or a Schedule F farm of this spouse: self-employment income (line 7). */
  hasBusiness: boolean;
}

/*
 * The form's inputs. spouses is undefined while the fact is missing or a W-2 on
 * the joint return cannot be placed with a spouse (missingInputs lists it).
 */
export interface Form8379Inputs {
  fact?: InjuredSpouseFactValue;
  spouses?: { injured: Form8379Spouse; other: Form8379Spouse };
}

/* The 1040 slots: line 15 reads whether the return itemizes, and the disaster loss case. */
export interface Form8379FilingInfo
  extends
    BaseFilingInfo,
    Pick<Form1040FilingInfo, "useItemizedDeductions" | "increasedStandardDeduction"> {
  form8379?: Form8379Inputs;
}
