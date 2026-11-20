/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4972FilingInfo } from "./filingInfo.js";
import type { Form4972 } from "./types.js";

export function register(): void {
  defineForm<Form4972, Form4972FilingInfo>("form-4972", { bindings: {} });
}
