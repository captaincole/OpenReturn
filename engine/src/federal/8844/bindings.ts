/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8844FilingInfo } from "./filingInfo.js";
import type { Form8844 } from "./types.js";

export function register(): void {
  defineForm<Form8844, Form8844FilingInfo>("form-8844", { bindings: {} });
}
