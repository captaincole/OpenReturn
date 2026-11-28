/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3568FilingInfo } from "./filingInfo.js";
import type { Form3568 } from "./types.js";

export function register(): void {
  defineForm<Form3568, Form3568FilingInfo>("form-3568", { bindings: {} });
}
