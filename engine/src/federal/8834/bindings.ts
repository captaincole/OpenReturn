/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8834FilingInfo } from "./filingInfo.js";
import type { Form8834 } from "./types.js";

export function register(): void {
  defineForm<Form8834, Form8834FilingInfo>("form-8834", { bindings: {} });
}
