/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form2210FilingInfo } from "./filingInfo.js";
import type { Form2210 } from "./types.js";

export function register(): void {
  defineForm<Form2210, Form2210FilingInfo>("form-2210", { bindings: {} });
}
