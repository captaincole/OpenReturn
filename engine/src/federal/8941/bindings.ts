/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8941FilingInfo } from "./filingInfo.js";
import type { Form8941 } from "./types.js";

export function register(): void {
  defineForm<Form8941, Form8941FilingInfo>("form-8941", { bindings: {} });
}
