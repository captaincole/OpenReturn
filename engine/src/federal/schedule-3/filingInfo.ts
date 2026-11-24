import type { Form1116FilingInfo } from "../1116/filingInfo.js";
import type { CreditLimitInfo } from "../8396/creditGap.js";
import type { Form8801FilingInfo } from "../8801/filingInfo.js";
import type { Form8863FilingInfo } from "../8863/filingInfo.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";
import type { Form8936FilingInfo } from "../8936/filingInfo.js";

/*
 * MANUAL EDIT: line 4 reads Form 8880's filing info to tell a gap from "no
 * credit". Line 6g reads Form 8396's gap, which needs the certificate and
 * Worksheet B's slots. Line 3 reads Form 8863's to tell a gap from "no credit".
 * Lines 6f and 6m read Form 8936's vehicles. Line 1 reads Form 1116's foreign
 * tax, a K-1's included. Line 6b reads Form 8801's 2024 lines.
 */
export type Schedule3FilingInfo = CreditLimitInfo &
  Form8880FilingInfo &
  Form8863FilingInfo &
  Form8936FilingInfo &
  Form1116FilingInfo &
  Form8801FilingInfo;
