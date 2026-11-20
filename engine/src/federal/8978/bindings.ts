/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8978FilingInfo } from "./filingInfo.js";
import type { Form8978 } from "./types.js";

export function register(): void {
  defineForm<Form8978, Form8978FilingInfo>("form-8978", { bindings: {} });
}
