/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8919FilingInfo } from "./filingInfo.js";
import type { Form8919 } from "./types.js";

export function register(): void {
  defineForm<Form8919, Form8919FilingInfo>("form-8919", { bindings: {} });
}
