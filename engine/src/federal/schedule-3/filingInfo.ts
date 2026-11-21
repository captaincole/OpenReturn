import type { CreditLimitInfo } from "../8396/creditGap.js";
import type { Form8880FilingInfo } from "../8880/filingInfo.js";

/*
 * MANUAL EDIT: line 4 reads Form 8880's filing info to tell a gap from "no
 * credit". Line 6g reads Form 8396's gap, which needs the certificate and
 * Worksheet B's slots.
 */
export interface Schedule3FilingInfo extends CreditLimitInfo, Form8880FilingInfo {}
