/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3805VFilingInfo } from "./filingInfo.js";
import type { Form3805V } from "./types.js";

export function register(): void {
  defineForm<Form3805V, Form3805VFilingInfo>("form-3805v", { bindings: {} });
}
