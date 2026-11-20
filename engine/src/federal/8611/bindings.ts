/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8611FilingInfo } from "./filingInfo.js";
import type { Form8611 } from "./types.js";

export function register(): void {
  defineForm<Form8611, Form8611FilingInfo>("form-8611", { bindings: {} });
}
