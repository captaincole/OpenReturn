/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3870FilingInfo } from "./filingInfo.js";
import type { Form3870 } from "./types.js";

export function register(): void {
  defineForm<Form3870, Form3870FilingInfo>("form-3870", { bindings: {} });
}
