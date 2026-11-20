/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8815FilingInfo } from "./filingInfo.js";
import type { Form8815 } from "./types.js";

export function register(): void {
  defineForm<Form8815, Form8815FilingInfo>("form-8815", { bindings: {} });
}
