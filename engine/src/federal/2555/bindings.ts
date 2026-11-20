/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form2555FilingInfo } from "./filingInfo.js";
import type { Form2555 } from "./types.js";

export function register(): void {
  defineForm<Form2555, Form2555FilingInfo>("form-2555", { bindings: {} });
}
