/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3801FilingInfo } from "./filingInfo.js";
import type { Form3801 } from "./types.js";

export function register(): void {
  defineForm<Form3801, Form3801FilingInfo>("form-3801", { bindings: {} });
}
