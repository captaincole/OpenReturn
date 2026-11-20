/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8911FilingInfo } from "./filingInfo.js";
import type { Form8911 } from "./types.js";

export function register(): void {
  defineForm<Form8911, Form8911FilingInfo>("form-8911", { bindings: {} });
}
