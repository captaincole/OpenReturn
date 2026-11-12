/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form6251FilingInfo } from "./filingInfo.js";
import type { Form6251 } from "./types.js";

export function register(): void {
  defineForm<Form6251, Form6251FilingInfo>("form-6251", {
    bindings: {},
  });
}
