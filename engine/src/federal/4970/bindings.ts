/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4970FilingInfo } from "./filingInfo.js";
import type { Form4970 } from "./types.js";

export function register(): void {
  defineForm<Form4970, Form4970FilingInfo>("form-4970", { bindings: {} });
}
