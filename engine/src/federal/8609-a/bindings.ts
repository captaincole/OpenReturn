/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8609AFilingInfo } from "./filingInfo.js";
import type { Form8609A } from "./types.js";

export function register(): void {
  defineForm<Form8609A, Form8609AFilingInfo>("form-8609-a", { bindings: {} });
}
