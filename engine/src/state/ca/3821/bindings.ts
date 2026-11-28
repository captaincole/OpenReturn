/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3821FilingInfo } from "./filingInfo.js";
import type { Form3821 } from "./types.js";

export function register(): void {
  defineForm<Form3821, Form3821FilingInfo>("form-3821", { bindings: {} });
}
