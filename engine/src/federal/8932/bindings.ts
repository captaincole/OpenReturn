/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8932FilingInfo } from "./filingInfo.js";
import type { Form8932 } from "./types.js";

export function register(): void {
  defineForm<Form8932, Form8932FilingInfo>("form-8932", { bindings: {} });
}
