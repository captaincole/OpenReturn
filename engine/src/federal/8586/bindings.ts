/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8586FilingInfo } from "./filingInfo.js";
import type { Form8586 } from "./types.js";

export function register(): void {
  defineForm<Form8586, Form8586FilingInfo>("form-8586", { bindings: {} });
}
