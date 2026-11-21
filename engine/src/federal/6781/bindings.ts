/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form6781FilingInfo } from "./filingInfo.js";
import type { Form6781 } from "./types.js";

export function register(): void {
  defineForm<Form6781, Form6781FilingInfo>("form-6781", { bindings: {} });
}
