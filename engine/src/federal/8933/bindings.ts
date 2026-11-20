/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933FilingInfo } from "./filingInfo.js";
import type { Form8933 } from "./types.js";

export function register(): void {
  defineForm<Form8933, Form8933FilingInfo>("form-8933", { bindings: {} });
}
