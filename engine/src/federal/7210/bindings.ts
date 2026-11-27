/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7210FilingInfo } from "./filingInfo.js";
import type { Form7210 } from "./types.js";

export function register(): void {
  defineForm<Form7210, Form7210FilingInfo>("form-7210", { bindings: {} });
}
