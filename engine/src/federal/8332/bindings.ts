/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8332FilingInfo } from "./filingInfo.js";
import type { Form8332 } from "./types.js";

export function register(): void {
  defineForm<Form8332, Form8332FilingInfo>("form-8332", { bindings: {} });
}
