/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8853FilingInfo } from "./filingInfo.js";
import type { Form8853 } from "./types.js";

export function register(): void {
  defineForm<Form8853, Form8853FilingInfo>("form-8853", { bindings: {} });
}
