/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3506FilingInfo } from "./filingInfo.js";
import type { Form3506 } from "./types.js";

export function register(): void {
  defineForm<Form3506, Form3506FilingInfo>("form-3506", { bindings: {} });
}
