/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form461FilingInfo } from "./filingInfo.js";
import type { Form461 } from "./types.js";

export function register(): void {
  defineForm<Form461, Form461FilingInfo>("form-461", { bindings: {} });
}
