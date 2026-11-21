/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8582CRFilingInfo } from "./filingInfo.js";
import type { Form8582CR } from "./types.js";

export function register(): void {
  defineForm<Form8582CR, Form8582CRFilingInfo>("form-8582-cr", { bindings: {} });
}
