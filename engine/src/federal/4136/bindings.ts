/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4136FilingInfo } from "./filingInfo.js";
import type { Form4136 } from "./types.js";

export function register(): void {
  defineForm<Form4136, Form4136FilingInfo>("form-4136", { bindings: {} });
}
