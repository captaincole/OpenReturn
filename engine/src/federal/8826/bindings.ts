/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8826FilingInfo } from "./filingInfo.js";
import type { Form8826 } from "./types.js";

export function register(): void {
  defineForm<Form8826, Form8826FilingInfo>("form-8826", { bindings: {} });
}
