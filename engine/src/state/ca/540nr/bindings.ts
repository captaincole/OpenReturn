/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form540NRFilingInfo } from "./filingInfo.js";
import type { Form540NR } from "./types.js";

export function register(): void {
  defineForm<Form540NR, Form540NRFilingInfo>("form-540nr", { bindings: {} });
}
