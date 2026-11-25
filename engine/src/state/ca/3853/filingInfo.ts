import type { CaCoverageMemberKind, CaHealthCoverageFactValue } from "../../../facts/index.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";
import type { Form3803FilingInfo } from "../3803/filingInfo.js";
import type { CodeInputs } from "./codes.js";

/* One member of the applicable household, in the order of Parts I and III (lines-1-12::b01). */
export interface Ca3853Member {
  /* The member's coverage fact key (ca_health_coverage.*). */
  factKey: string;
  kind: CaCoverageMemberKind;
  /* A claimed dependent's slug: FTB 3803 lists the child by it. */
  dependentSlug?: string;
  firstName?: string;
  middleInitial?: string;
  lastName?: string;
  /* The SSN, ITIN or ATIN as nine digits, or undefined: Part I prints "No ID". */
  idNumber?: string;
  dob?: string;
  /* 18 for the whole month from this month (1 to 12; 13 not in 2025); undefined while the date of birth waits. */
  adultFromMonth?: number;
  /* Turned 18 during 2025: Step 1 question 4 sends the household to Worksheet A. */
  turned18In2025: boolean;
  /* Undefined while the member's coverage fact is missing. */
  coverage?: CaHealthCoverageFactValue;
  codeInputs?: CodeInputs;
}

export interface Ca3853Household {
  members: Ca3853Member[];
  /* Step 1 question 1. Undefined while it waits. */
  claimableAsDependent?: boolean;
  grossIncome?: number;
  /* The household income holds amounts that gross income does not, so the Part II test asks gross income. */
  grossIncomeAsked: boolean;
  salaryReductionPremiums?: number;
  /* 1099-INT box 3: interest California exempts that the engine's Schedule CA line 2b column B does not yet subtract. */
  usObligationInterest: number;
  /* The filers 65 or older on December 31, 2025 (the chart's rows); undefined while a date of birth waits. */
  people65OrOlder?: number;
  dependentsClaimed: number;
}

/*
 * FTB 3853 reads the FTB 3803 children for Step 3 question 6. Form 540 line
 * 92 reads the same household (penalty.ts).
 */
export interface Form3853FilingInfo
  extends BaseFilingInfo, Pick<Form3803FilingInfo, "form3803Children"> {
  ca3853?: Ca3853Household;
}
