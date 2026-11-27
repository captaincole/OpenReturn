/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8835FilingInfo } from "./filingInfo.js";
import type { Form8835 } from "./types.js";

export function register(): void {
  defineForm<Form8835, Form8835FilingInfo>("form-8835", { bindings: {} });
}
