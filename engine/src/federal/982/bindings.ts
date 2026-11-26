/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form982FilingInfo } from "./filingInfo.js";
import type { Form982 } from "./types.js";

export function register(): void {
  defineForm<Form982, Form982FilingInfo>("form-982", { bindings: {} });
}
