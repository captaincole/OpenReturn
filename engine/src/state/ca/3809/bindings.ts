/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3809FilingInfo } from "./filingInfo.js";
import type { Form3809 } from "./types.js";

export function register(): void {
  defineForm<Form3809, Form3809FilingInfo>("form-3809", { bindings: {} });
}
