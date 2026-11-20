/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8828FilingInfo } from "./filingInfo.js";
import type { Form8828 } from "./types.js";

export function register(): void {
  defineForm<Form8828, Form8828FilingInfo>("form-8828", { bindings: {} });
}
