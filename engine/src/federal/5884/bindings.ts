/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form5884FilingInfo } from "./filingInfo.js";
import type { Form5884 } from "./types.js";

export function register(): void {
  defineForm<Form5884, Form5884FilingInfo>("form-5884", { bindings: {} });
}
