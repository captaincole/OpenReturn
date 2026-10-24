/*
 * Schedule2FilingInfo — Schedule 2 (Additional Taxes) specific slots
 * layered on top of BaseFilingInfo.
 *
 * Every computed line reads other forms (Form 8959 line 18, Form 8960
 * line 17, Form 8889 lines 17b/21), so the form adds no slots.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Schedule2FilingInfo extends BaseFilingInfo {}
