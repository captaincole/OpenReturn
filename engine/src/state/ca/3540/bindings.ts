/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3540FilingInfo } from "./filingInfo.js";
import type { Form3540 } from "./types.js";

export function register(): void {
  defineForm<Form3540, Form3540FilingInfo>("form-3540", { bindings: {} });
}
