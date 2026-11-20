/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4137FilingInfo } from "./filingInfo.js";
import type { Form4137 } from "./types.js";

export function register(): void {
  defineForm<Form4137, Form4137FilingInfo>("form-4137", { bindings: {} });
}
