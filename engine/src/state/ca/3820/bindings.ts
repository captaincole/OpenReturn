/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3820FilingInfo } from "./filingInfo.js";
import type { Form3820 } from "./types.js";

export function register(): void {
  defineForm<Form3820, Form3820FilingInfo>("form-3820", { bindings: {} });
}
