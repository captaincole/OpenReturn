/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8915FFilingInfo } from "./filingInfo.js";
import type { Form8915F } from "./types.js";

export function register(): void {
  defineForm<Form8915F, Form8915FFilingInfo>("form-8915-f", { bindings: {} });
}
