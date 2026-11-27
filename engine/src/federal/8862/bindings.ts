/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8862FilingInfo } from "./filingInfo.js";
import type { Form8862 } from "./types.js";

export function register(): void {
  defineForm<Form8862, Form8862FilingInfo>("form-8862", { bindings: {} });
}
