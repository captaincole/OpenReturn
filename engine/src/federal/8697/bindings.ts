/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8697FilingInfo } from "./filingInfo.js";
import type { Form8697 } from "./types.js";

export function register(): void {
  defineForm<Form8697, Form8697FilingInfo>("form-8697", { bindings: {} });
}
