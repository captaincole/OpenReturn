/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8283FilingInfo } from "./filingInfo.js";
import type { Form8283 } from "./types.js";

export function register(): void {
  defineForm<Form8283, Form8283FilingInfo>("form-8283", { bindings: {} });
}
