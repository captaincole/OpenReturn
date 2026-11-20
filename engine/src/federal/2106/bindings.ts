/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form2106FilingInfo } from "./filingInfo.js";
import type { Form2106 } from "./types.js";

export function register(): void {
  defineForm<Form2106, Form2106FilingInfo>("form-2106", { bindings: {} });
}
