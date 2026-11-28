/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3503FilingInfo } from "./filingInfo.js";
import type { Form3503 } from "./types.js";

export function register(): void {
  defineForm<Form3503, Form3503FilingInfo>("form-3503", { bindings: {} });
}
