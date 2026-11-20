/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8888FilingInfo } from "./filingInfo.js";
import type { Form8888 } from "./types.js";

export function register(): void {
  defineForm<Form8888, Form8888FilingInfo>("form-8888", { bindings: {} });
}
