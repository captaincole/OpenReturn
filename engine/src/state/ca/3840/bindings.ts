/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3840FilingInfo } from "./filingInfo.js";
import type { Form3840 } from "./types.js";

export function register(): void {
  defineForm<Form3840, Form3840FilingInfo>("form-3840", { bindings: {} });
}
