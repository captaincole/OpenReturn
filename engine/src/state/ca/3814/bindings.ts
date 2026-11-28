/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3814FilingInfo } from "./filingInfo.js";
import type { Form3814 } from "./types.js";

export function register(): void {
  defineForm<Form3814, Form3814FilingInfo>("form-3814", { bindings: {} });
}
