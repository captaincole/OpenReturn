/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8864FilingInfo } from "./filingInfo.js";
import type { Form8864 } from "./types.js";

export function register(): void {
  defineForm<Form8864, Form8864FilingInfo>("form-8864", { bindings: {} });
}
