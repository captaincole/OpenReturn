/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3541FilingInfo } from "./filingInfo.js";
import type { Form3541 } from "./types.js";

export function register(): void {
  defineForm<Form3541, Form3541FilingInfo>("form-3541", { bindings: {} });
}
