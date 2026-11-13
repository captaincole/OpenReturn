/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8829FilingInfo } from "./filingInfo.js";
import type { Form8829 } from "./types.js";

export function register(): void {
  defineForm<Form8829, Form8829FilingInfo>("form-8829", { bindings: {} });
}
