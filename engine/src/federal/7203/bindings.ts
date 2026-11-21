/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7203FilingInfo } from "./filingInfo.js";
import type { Form7203 } from "./types.js";

export function register(): void {
  defineForm<Form7203, Form7203FilingInfo>("form-7203", { bindings: {} });
}
