/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3510FilingInfo } from "./filingInfo.js";
import type { Form3510 } from "./types.js";

export function register(): void {
  defineForm<Form3510, Form3510FilingInfo>("form-3510", { bindings: {} });
}
