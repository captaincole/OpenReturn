/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form3800FilingInfo } from "./filingInfo.js";
import type { Form3800 } from "./types.js";

export function register(): void {
  defineForm<Form3800, Form3800FilingInfo>("form-3800", { bindings: {} });
}
