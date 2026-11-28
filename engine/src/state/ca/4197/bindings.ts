/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form4197FilingInfo } from "./filingInfo.js";
import type { Form4197 } from "./types.js";

export function register(): void {
  defineForm<Form4197, Form4197FilingInfo>("form-4197", { bindings: {} });
}
