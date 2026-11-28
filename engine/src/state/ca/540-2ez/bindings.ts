/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form540TwoEZFilingInfo } from "./filingInfo.js";
import type { Form540TwoEZ } from "./types.js";

export function register(): void {
  defineForm<Form540TwoEZ, Form540TwoEZFilingInfo>("form-540-2ez", { bindings: {} });
}
