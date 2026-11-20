/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8814FilingInfo } from "./filingInfo.js";
import type { Form8814 } from "./types.js";

export function register(): void {
  defineForm<Form8814, Form8814FilingInfo>("form-8814", { bindings: {} });
}
