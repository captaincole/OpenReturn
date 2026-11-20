/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4835FilingInfo } from "./filingInfo.js";
import type { Form4835 } from "./types.js";

export function register(): void {
  defineForm<Form4835, Form4835FilingInfo>("form-4835", { bindings: {} });
}
