/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8938FilingInfo } from "./filingInfo.js";
import type { Form8938 } from "./types.js";

export function register(): void {
  defineForm<Form8938, Form8938FilingInfo>("form-8938", { bindings: {} });
}
