/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3531FilingInfo } from "./filingInfo.js";
import type { Form3531 } from "./types.js";

export function register(): void {
  defineForm<Form3531, Form3531FilingInfo>("form-3531", { bindings: {} });
}
