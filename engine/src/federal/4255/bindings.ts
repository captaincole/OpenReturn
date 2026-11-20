/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4255FilingInfo } from "./filingInfo.js";
import type { Form4255 } from "./types.js";

export function register(): void {
  defineForm<Form4255, Form4255FilingInfo>("form-4255", { bindings: {} });
}
