/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3592FilingInfo } from "./filingInfo.js";
import type { Form3592 } from "./types.js";

export function register(): void {
  defineForm<Form3592, Form3592FilingInfo>("form-3592", { bindings: {} });
}
