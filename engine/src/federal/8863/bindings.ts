/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8863FilingInfo } from "./filingInfo.js";
import type { Form8863 } from "./types.js";

export function register(): void {
  defineForm<Form8863, Form8863FilingInfo>("form-8863", { bindings: {} });
}
