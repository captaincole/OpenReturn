import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import type { Form3800Info } from "../3800/tax.js";
import type { CreditLimitInfo } from "../8396/creditGap.js";
import type { Form8801FilingInfo } from "../8801/filingInfo.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";
import type { Form8911FilingInfo } from "../8911/filingInfo.js";
import type { Form8912FilingInfo } from "../8912/filingInfo.js";
import type { Form8936FilingInfo } from "../8936/filingInfo.js";
import type { Form8978FilingInfo } from "../8978/filingInfo.js";

/*
 * MANUAL EDIT: line 4 reads Form 8880's filing info to tell a gap from "no
 * credit". Line 6g reads Form 8396's gap, which needs the certificate and
 * Worksheet B's slots. Line 3 reads Form 8863's to tell a gap from "no credit".
 * Lines 6f and 6m read Form 8936's vehicles. Line 1 reads Form 1116's foreign
 * tax, a K-1's included. Line 6b reads Form 8801's 2024 lines. Line 6j reads
 * Form 8911's Schedules A. Line 6a reads Form 3800's sources. Line 6l reads
 * Form 8978's line 14 total. Line 6i reads Form 8834's passive carryovers
 * (in Form 3800's, through Form 8582-CR). Line 6k reads Form 8912's Parts III
 * and IV. Lines 10 and 11 read Part II's own slots below.
 */

/*
 * Schedule 3 lines 10 and 11 in whole dollars, from the facts (resolvePartTwo.ts).
 * Form 1040 line 31 reads them too, so it reads no Schedule 3 field (partTwo.ts).
 */
export interface Schedule3PartTwoInfo extends BaseFilingInfo {
  /* Line 10: the payment with an extension; undefined with none. */
  schedule3ExtensionPayment?: number;
  /* Line 11: the excess social security tax of both spouses; undefined with none or with a gap. */
  schedule3ExcessSocialSecurity?: number;
  /* Why line 11 is unsupported. */
  schedule3ExcessSocialSecurityGap?: string;
}

export type Schedule3FilingInfo = Schedule3PartTwoInfo &
  Form3800Info &
  Form8912FilingInfo &
  CreditLimitInfo &
  Form8978FilingInfo &
  Form8880FilingInfo &
  Form8911FilingInfo &
  Form8863FilingInfo &
  Form8936FilingInfo &
  Form1116FilingInfo &
  Form8801FilingInfo;
