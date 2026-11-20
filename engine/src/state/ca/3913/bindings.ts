/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3913FilingInfo } from "./filingInfo.js";
import type { Form3913 } from "./types.js";

export function register(): void {
  defineForm<Form3913, Form3913FilingInfo>("form-3913", { bindings: {} });
}
