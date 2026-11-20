/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8839FilingInfo } from "./filingInfo.js";
import type { Form8839 } from "./types.js";

export function register(): void {
  defineForm<Form8839, Form8839FilingInfo>("form-8839", { bindings: {} });
}
