/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8900FilingInfo } from "./filingInfo.js";
import type { Form8900 } from "./types.js";

export function register(): void {
  defineForm<Form8900, Form8900FilingInfo>("form-8900", { bindings: {} });
}
