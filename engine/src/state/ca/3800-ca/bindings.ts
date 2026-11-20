/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3800CaFilingInfo } from "./filingInfo.js";
import type { Form3800Ca } from "./types.js";

export function register(): void {
  defineForm<Form3800Ca, Form3800CaFilingInfo>("form-3800-ca", { bindings: {} });
}
