/*
 * ScheduleCaFilingInfo — Schedule CA (540) specific slots layered on
 * top of BaseFilingInfo.
 *
 * Schedule CA is almost entirely a derivative of federal Form 1040.
 * Col A echoes federal income lines; col B/C record CA adjustments.
 * Most bindings read upstream values via cross-form references on the
 * form accessor (e.g. f["form-1040.line.1a"]), not via FilingInfo.
 *
 * This interface stays minimal on purpose: only the HSA employer
 * contributions for now. Add a slot here when a Schedule CA binding
 * needs a value that the form accessor and BaseFilingInfo cannot reach.
 */

import type { Form8889FilingInfo } from "../../../federal/8889/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface ScheduleCaFilingInfo
  extends BaseFilingInfo, Pick<Form8889FilingInfo, "hsaEmployerContributions"> {}
