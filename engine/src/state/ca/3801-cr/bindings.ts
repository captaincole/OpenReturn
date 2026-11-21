/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3801CRFilingInfo } from "./filingInfo.js";
import type { Form3801CR } from "./types.js";

export function register(): void {
  defineForm<Form3801CR, Form3801CRFilingInfo>("form-3801-cr", { bindings: {} });
}
