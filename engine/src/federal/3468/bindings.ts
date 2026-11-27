/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form3468FilingInfo } from "./filingInfo.js";
import type { Form3468 } from "./types.js";

export function register(): void {
  defineForm<Form3468, Form3468FilingInfo>("form-3468", { bindings: {} });
}
