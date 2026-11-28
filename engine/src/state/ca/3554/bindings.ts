/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3554FilingInfo } from "./filingInfo.js";
import type { Form3554 } from "./types.js";

export function register(): void {
  defineForm<Form3554, Form3554FilingInfo>("form-3554", { bindings: {} });
}
