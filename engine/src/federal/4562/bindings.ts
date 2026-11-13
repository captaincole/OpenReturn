/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4562FilingInfo } from "./filingInfo.js";
import type { Form4562 } from "./types.js";

export function register(): void {
  defineForm<Form4562, Form4562FilingInfo>("form-4562", { bindings: {} });
}
