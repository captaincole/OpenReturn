/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8379FilingInfo } from "./filingInfo.js";
import type { Form8379 } from "./types.js";

export function register(): void {
  defineForm<Form8379, Form8379FilingInfo>("form-8379", { bindings: {} });
}
