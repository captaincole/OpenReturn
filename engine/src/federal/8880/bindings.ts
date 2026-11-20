/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8880FilingInfo } from "./filingInfo.js";
import type { Form8880 } from "./types.js";

export function register(): void {
  defineForm<Form8880, Form8880FilingInfo>("form-8880", { bindings: {} });
}
