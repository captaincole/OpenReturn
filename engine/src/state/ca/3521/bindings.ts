/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3521FilingInfo } from "./filingInfo.js";
import type { Form3521 } from "./types.js";

export function register(): void {
  defineForm<Form3521, Form3521FilingInfo>("form-3521", { bindings: {} });
}
