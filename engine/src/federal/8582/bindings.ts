/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm } from "../../defineForm.js";
import type { Form8582FilingInfo } from "./filingInfo.js";
import type { Form8582 } from "./types.js";

export function register(): void {
  defineForm<Form8582, Form8582FilingInfo>("form-8582", { bindings: {} });
}
