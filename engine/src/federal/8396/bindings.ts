/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8396FilingInfo } from "./filingInfo.js";
import type { Form8396 } from "./types.js";

export function register(): void {
  defineForm<Form8396, Form8396FilingInfo>("form-8396", { bindings: {} });
}
