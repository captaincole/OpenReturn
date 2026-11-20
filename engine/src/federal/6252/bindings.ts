/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form6252FilingInfo } from "./filingInfo.js";
import type { Form6252 } from "./types.js";

export function register(): void {
  defineForm<Form6252, Form6252FilingInfo>("form-6252", { bindings: {} });
}
