/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3547FilingInfo } from "./filingInfo.js";
import type { Form3547 } from "./types.js";

export function register(): void {
  defineForm<Form3547, Form3547FilingInfo>("form-3547", { bindings: {} });
}
