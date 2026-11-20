/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3461FilingInfo } from "./filingInfo.js";
import type { Form3461 } from "./types.js";

export function register(): void {
  defineForm<Form3461, Form3461FilingInfo>("form-3461", { bindings: {} });
}
