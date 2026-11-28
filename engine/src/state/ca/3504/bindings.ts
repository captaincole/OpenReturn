/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3504FilingInfo } from "./filingInfo.js";
import type { Form3504 } from "./types.js";

export function register(): void {
  defineForm<Form3504, Form3504FilingInfo>("form-3504", { bindings: {} });
}
