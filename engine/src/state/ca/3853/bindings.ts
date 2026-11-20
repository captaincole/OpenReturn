/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3853FilingInfo } from "./filingInfo.js";
import type { Form3853 } from "./types.js";

export function register(): void {
  defineForm<Form3853, Form3853FilingInfo>("form-3853", { bindings: {} });
}
