/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3831FilingInfo } from "./filingInfo.js";
import type { Form3831 } from "./types.js";

export function register(): void {
  defineForm<Form3831, Form3831FilingInfo>("form-3831", { bindings: {} });
}
