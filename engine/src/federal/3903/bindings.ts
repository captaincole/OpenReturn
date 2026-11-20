/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form3903FilingInfo } from "./filingInfo.js";
import type { Form3903 } from "./types.js";

export function register(): void {
  defineForm<Form3903, Form3903FilingInfo>("form-3903", { bindings: {} });
}
