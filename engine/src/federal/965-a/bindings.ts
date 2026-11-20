/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form965AFilingInfo } from "./filingInfo.js";
import type { Form965A } from "./types.js";

export function register(): void {
  defineForm<Form965A, Form965AFilingInfo>("form-965-a", { bindings: {} });
}
