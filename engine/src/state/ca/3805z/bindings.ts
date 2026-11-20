/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3805ZFilingInfo } from "./filingInfo.js";
import type { Form3805Z } from "./types.js";

export function register(): void {
  defineForm<Form3805Z, Form3805ZFilingInfo>("form-3805z", { bindings: {} });
}
