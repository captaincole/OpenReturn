/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form6478FilingInfo } from "./filingInfo.js";
import type { Form6478 } from "./types.js";

export function register(): void {
  defineForm<Form6478, Form6478FilingInfo>("form-6478", { bindings: {} });
}
