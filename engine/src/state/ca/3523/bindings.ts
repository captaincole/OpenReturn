/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3523FilingInfo } from "./filingInfo.js";
import type { Form3523 } from "./types.js";

export function register(): void {
  defineForm<Form3523, Form3523FilingInfo>("form-3523", { bindings: {} });
}
