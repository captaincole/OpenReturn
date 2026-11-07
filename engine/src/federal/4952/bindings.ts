/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4952FilingInfo } from "./filingInfo.js";
import type { Form4952 } from "./types.js";

export function register(): void {
  defineForm<Form4952, Form4952FilingInfo>("form-4952", { bindings: {} });
}
