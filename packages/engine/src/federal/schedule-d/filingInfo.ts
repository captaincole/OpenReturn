/*
 * ScheduleDFilingInfo — Schedule D (Capital Gains and Losses) specific
 * slots layered on top of BaseFilingInfo.
 *
 * Schedule D is almost entirely a summarizer over 8949. It reads the
 * Part I / Part II totals via cross-form references, then nets them
 * into line 16, the value Form 1040 line 7a consumes. The arithmetic
 * needs no slots of its own; it borrows the 8949 box totals.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { Form8949FilingInfo } from "../8949/filingInfo.js";

export interface ScheduleDFilingInfo
  extends BaseFilingInfo, Pick<Form8949FilingInfo, "form8949BoxTotals"> {}
