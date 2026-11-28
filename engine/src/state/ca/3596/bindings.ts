/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3596FilingInfo } from "./filingInfo.js";
import type { Form3596 } from "./types.js";

export function register(): void {
  defineForm<Form3596, Form3596FilingInfo>("form-3596", { bindings: {} });
}
