/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3507FilingInfo } from "./filingInfo.js";
import type { Form3507 } from "./types.js";

export function register(): void {
  defineForm<Form3507, Form3507FilingInfo>("form-3507", { bindings: {} });
}
