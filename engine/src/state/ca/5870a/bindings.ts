/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form5870AFilingInfo } from "./filingInfo.js";
import type { Form5870A } from "./types.js";

export function register(): void {
  defineForm<Form5870A, Form5870AFilingInfo>("form-5870a", { bindings: {} });
}
