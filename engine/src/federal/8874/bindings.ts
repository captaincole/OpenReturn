/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8874FilingInfo } from "./filingInfo.js";
import type { Form8874 } from "./types.js";

export function register(): void {
  defineForm<Form8874, Form8874FilingInfo>("form-8874", { bindings: {} });
}
