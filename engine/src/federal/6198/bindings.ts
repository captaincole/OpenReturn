/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form6198FilingInfo } from "./filingInfo.js";
import type { Form6198 } from "./types.js";

export function register(): void {
  defineForm<Form6198, Form6198FilingInfo>("form-6198", { bindings: {} });
}
