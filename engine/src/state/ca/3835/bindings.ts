/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3835FilingInfo } from "./filingInfo.js";
import type { Form3835 } from "./types.js";

export function register(): void {
  defineForm<Form3835, Form3835FilingInfo>("form-3835", { bindings: {} });
}
