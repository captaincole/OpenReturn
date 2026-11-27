/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8896FilingInfo } from "./filingInfo.js";
import type { Form8896 } from "./types.js";

export function register(): void {
  defineForm<Form8896, Form8896FilingInfo>("form-8896", { bindings: {} });
}
