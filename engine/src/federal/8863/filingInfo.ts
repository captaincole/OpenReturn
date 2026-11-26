import type { BaseFilingInfo } from "../../filingInfo.js";
import type { SSN } from "../../values.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import type { Form8978FilingInfo } from "../8978/filingInfo.js";
import type { AmericanOpportunityLines, StudentCredit } from "./lines.js";
import type { RefundOutcome } from "./refund.js";

/* One column of Part III line 22. */
export interface InstitutionColumn {
  name?: string;
  /* Line 22(1), on one line. */
  address?: string;
  /* Line 22(2); undefined while the answer is missing. */
  received2025?: boolean;
  /* Line 22(3). */
  received2024Box7: boolean;
  /* Line 22(4): the 9 digits, when the line asks for the EIN and the facts hold it. */
  ein?: string;
}

/* One student's Part III (lines 20–31). */
export interface StudentPartIII {
  factKey: string;
  name: string;
  ssn?: SSN;
  institutions: InstitutionColumn[];
  /* Lines 23–26 along the form's path; a question after a "Stop!" stays undefined. */
  line23: boolean;
  line24?: boolean;
  line25?: boolean;
  line26?: boolean;
  credit: StudentCredit;
  /* Lines 27–30 for the American opportunity credit. */
  americanOpportunity?: AmericanOpportunityLines;
  /* Line 31 for the lifetime learning credit. */
  line31?: number;
  /* An answer of line 22 is missing (the EIN, or line 22(2) with no Form 1098-T). */
  waits: boolean;
}

/* One printed page 2: a student, from one institution on. A continuation page stops at line 22. */
export interface PartIIIPage {
  student: number;
  firstInstitution: number;
  continuation: boolean;
}

export interface Form8863Figured {
  students: StudentPartIII[];
  pages: PartIIIPage[];
  /* Line 1: the total of every Part III line 30. */
  line1: number;
  /* Line 10: the total of every Part III line 31. */
  line10: number;
  /* A student takes the American opportunity credit: Part I is filled. */
  americanOpportunity: boolean;
  /* Line 7: whether the refundable part is allowed. */
  refund: RefundOutcome;
  /* A Form 1098-T that no student fact names: the student's answers are missing, so the totals wait. */
  studentsMissing: boolean;
}

/*
 * Form 1116's slots: the worksheet asks foreignTaxCreditGap whether Schedule 3
 * line 1 is a gap, and Form 8978's whether line 6l is.
 */
export interface Form8863FilingInfo
  extends BaseFilingInfo, Form1116FilingInfo, Pick<Form8978FilingInfo, "form8978"> {
  form8863?: Form8863Figured;
  /* Which page 2 this copy prints (renderCopies sets it); absent means the first. */
  form8863CopyIndex?: number;
}
