/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3548FilingInfo } from "./filingInfo.js";
import type { Form3548 } from "./types.js";

export function register(): void {
  defineForm<Form3548, Form3548FilingInfo>("form-3548", { bindings: {} });
}
