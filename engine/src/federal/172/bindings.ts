/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form172FilingInfo } from "./filingInfo.js";
import type { Form172 } from "./types.js";

export function register(): void {
  defineForm<Form172, Form172FilingInfo>("form-172", { bindings: {} });
}
