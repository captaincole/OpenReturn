/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3804CRFilingInfo } from "./filingInfo.js";
import type { Form3804CR } from "./types.js";

export function register(): void {
  defineForm<Form3804CR, Form3804CRFilingInfo>("form-3804-cr", { bindings: {} });
}
