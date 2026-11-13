/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3885AFilingInfo } from "./filingInfo.js";
import type { Form3885A } from "./types.js";

export function register(): void {
  defineForm<Form3885A, Form3885AFilingInfo>("form-3885a", { bindings: {} });
}
