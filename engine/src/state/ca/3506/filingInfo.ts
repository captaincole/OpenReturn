import type {
  CaHouseholdFundsEntry,
  CaPriorYearDependentCareFactValue,
} from "../../../facts/index.js";
import type { Form2441FilingInfo } from "../../../federal/2441/filingInfo.js";
import type { Phone, SSN } from "../../../values.js";

/* Part II line 1: one care provider whose care was given in California (or whose place is not known yet). */
export interface CaCareProviderRow {
  factKey: string;
  /* Line 1a. */
  name: string;
  /* Line 1b, one line. */
  address: string;
  /* Line 1c. */
  phone?: Phone;
  /* Line 1d; undefined while the answer waits. */
  providerType?: "person" | "organization";
  /* Line 1e: nine digits, or "Tax-exempt". */
  tin?: string;
  taxExempt: boolean;
  /* Line 1f, one line; undefined while the place of care is not known. */
  careAddress?: string;
  /* Line 1g. */
  amountPaid: number;
  employerProvided: boolean;
}

/* Part III line 2: one qualifying person cared for in California. */
export interface CaCarePersonRow {
  factKey: string;
  firstName?: string;
  lastName?: string;
  ssn?: SSN;
  /* Column (c), MM/DD/YYYY. */
  dob?: string;
  disabled: boolean;
  /* Column (d), only with shared custody. */
  custodyPercent?: number;
  /* Column (e); undefined while the California part of the expenses waits. */
  californiaExpenses?: number;
}

/*
 * FTB 3506 reads the Form 2441 slots (benefits, the married-filing-separately
 * answer, the earned income inputs) and these. Lines 4, 5, 19 and 20 read
 * Form 1040, Schedule SE and Schedule 1 through the federal earned income rule.
 */
export interface Form3506FilingInfo extends Form2441FilingInfo {
  caCareProviders?: CaCareProviderRow[];
  caCarePersons?: CaCarePersonRow[];
  /* Worksheet line 2; 0 when no 2024 expenses for care in California were paid in 2025. */
  caPriorYearExpensesPaid?: number;
  caPriorYearWorksheet?: CaPriorYearDependentCareFactValue;
  /* Part I: the stated household money that is not on the return. */
  caHouseholdFunds?: CaHouseholdFundsEntry[];
}
