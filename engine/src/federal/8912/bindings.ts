/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8912FilingInfo } from "./filingInfo.js";
import type { Form8912 } from "./types.js";

export function register(): void {
  defineForm<Form8912, Form8912FilingInfo>("form-8912", { bindings: {} });
}
