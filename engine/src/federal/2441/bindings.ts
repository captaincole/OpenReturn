/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form2441FilingInfo } from "./filingInfo.js";
import type { Form2441 } from "./types.js";

export function register(): void {
  defineForm<Form2441, Form2441FilingInfo>("form-2441", { bindings: {} });
}
