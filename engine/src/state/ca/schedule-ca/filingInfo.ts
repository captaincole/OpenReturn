/*
 * Bindings read federal values through the form accessor (f["form-1040.line.1a"]).
 * Add a slot here only when the accessor and BaseFilingInfo cannot reach a value.
 */

import type { Form8889FilingInfo } from "../../../federal/8889/filingInfo.js";
import type { BaseFilingInfo } from "../../../filingInfo.js";

export interface ScheduleCaFilingInfo
  extends BaseFilingInfo, Pick<Form8889FilingInfo, "hsaEmployerContributions"> {}
