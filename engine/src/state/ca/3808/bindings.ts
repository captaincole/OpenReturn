/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3808FilingInfo } from "./filingInfo.js";
import type { Form3808 } from "./types.js";

export function register(): void {
  defineForm<Form3808, Form3808FilingInfo>("form-3808", { bindings: {} });
}
