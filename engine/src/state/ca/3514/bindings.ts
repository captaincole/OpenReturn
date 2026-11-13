/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3514FilingInfo } from "./filingInfo.js";
import type { Form3514 } from "./types.js";

export function register(): void {
  defineForm<Form3514, Form3514FilingInfo>("form-3514", { bindings: {} });
}
