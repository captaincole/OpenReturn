/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3803FilingInfo } from "./filingInfo.js";
import type { Form3803 } from "./types.js";

export function register(): void {
  defineForm<Form3803, Form3803FilingInfo>("form-3803", { bindings: {} });
}
