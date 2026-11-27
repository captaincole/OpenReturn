/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form2210FFilingInfo } from "./filingInfo.js";
import type { Form2210F } from "./types.js";

export function register(): void {
  defineForm<Form2210F, Form2210FFilingInfo>("form-2210-f", { bindings: {} });
}
