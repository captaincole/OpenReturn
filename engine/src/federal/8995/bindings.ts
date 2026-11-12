/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8995FilingInfo } from "./filingInfo.js";
import type { Form8995 } from "./types.js";

export function register(): void {
  defineForm<Form8995, Form8995FilingInfo>("form-8995", { bindings: {} });
}
