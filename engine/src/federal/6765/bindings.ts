/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form6765FilingInfo } from "./filingInfo.js";
import type { Form6765 } from "./types.js";

export function register(): void {
  defineForm<Form6765, Form6765FilingInfo>("form-6765", { bindings: {} });
}
