/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8881FilingInfo } from "./filingInfo.js";
import type { Form8881 } from "./types.js";

export function register(): void {
  defineForm<Form8881, Form8881FilingInfo>("form-8881", { bindings: {} });
}
