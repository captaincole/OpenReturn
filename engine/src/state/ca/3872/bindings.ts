/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3872FilingInfo } from "./filingInfo.js";
import type { Form3872 } from "./types.js";

export function register(): void {
  defineForm<Form3872, Form3872FilingInfo>("form-3872", { bindings: {} });
}
