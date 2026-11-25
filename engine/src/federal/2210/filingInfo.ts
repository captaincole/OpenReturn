import type { AnnualizedPeriodFactValue, WaiverRequest } from "../../facts/index.js";
import type { BaseFilingInfo } from "../../filingInfo.js";
import type { DatedPayment } from "./penaltyWorksheet.js";

/* The answers Form 2210 reads, from the facts (resolveInfo.ts). */
export interface Form2210Answers {
  /* Estimated tax payments and the applied 2024 overpayment: whole dollars on their counted days. */
  estimatedPayments: DatedPayment[];
  /* The 2024 tax (prior_year.federal_tax); undefined with no 12-month 2024 return or no answer. */
  priorYearTax?: number;
  priorYearAgi?: number;
  noTwelveMonthReturn: boolean;
  jointReturn2024?: boolean;
  waiver?: { request: WaiverRequest; amount?: number };
  /* Box D: withholding on its counted days, as stated; it must add up to line 6. */
  datedWithholding?: DatedPayment[];
  /* Box C: Schedule AI columns (a)–(c), present only when all three are stated. */
  annualizedPeriods?: AnnualizedPeriodFactValue[];
  /* Some periods are stated and some are not: the form waits for the rest. */
  annualizedPeriodsIncomplete: boolean;
}

export interface Form2210FilingInfo extends BaseFilingInfo {
  /* Form 1040 line 26: 2025 estimated tax payments and the 2024 overpayment applied; undefined with none. */
  estimatedTaxPaid?: number;
  form2210?: Form2210Answers;
  /* Why the form cannot be figured from the answers (a date that cannot be read). */
  form2210Gap?: string;
}
