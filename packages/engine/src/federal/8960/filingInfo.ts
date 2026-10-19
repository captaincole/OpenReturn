/*
 * Form8960FilingInfo — Form 8960 (Net Investment Income Tax) specific
 * slots layered on top of BaseFilingInfo.
 *
 * Every computed line reads other forms (1040 lines 2b, 3b, 7a, 11b;
 * Schedule 1; Schedule A line 9), so the form adds no slots. The
 * filing-status threshold is a binding-side lookup.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";

export interface Form8960FilingInfo extends BaseFilingInfo {}
