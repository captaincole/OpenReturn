/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form5471FilingInfo } from "./filingInfo.js";
import type { Form5471 } from "./types.js";

export function register(): void {
  defineForm<Form5471, Form5471FilingInfo>("form-5471", { bindings: {} });
}
