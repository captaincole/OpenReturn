/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8992FilingInfo } from "./filingInfo.js";
import type { Form8992 } from "./types.js";

export function register(): void {
  defineForm<Form8992, Form8992FilingInfo>("form-8992", { bindings: {} });
}
