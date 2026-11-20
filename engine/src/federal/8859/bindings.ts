/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8859FilingInfo } from "./filingInfo.js";
import type { Form8859 } from "./types.js";

export function register(): void {
  defineForm<Form8859, Form8859FilingInfo>("form-8859", { bindings: {} });
}
