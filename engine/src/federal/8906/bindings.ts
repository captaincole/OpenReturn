/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8906FilingInfo } from "./filingInfo.js";
import type { Form8906 } from "./types.js";

export function register(): void {
  defineForm<Form8906, Form8906FilingInfo>("form-8906", { bindings: {} });
}
