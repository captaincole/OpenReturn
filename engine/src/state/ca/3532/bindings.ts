/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm } from "../../../defineForm.js";
import type { Form3532FilingInfo } from "./filingInfo.js";
import type { Form3532 } from "./types.js";

export function register(): void {
  defineForm<Form3532, Form3532FilingInfo>("form-3532", { bindings: {} });
}
