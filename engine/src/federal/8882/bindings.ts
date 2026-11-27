/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8882FilingInfo } from "./filingInfo.js";
import type { Form8882 } from "./types.js";

export function register(): void {
  defineForm<Form8882, Form8882FilingInfo>("form-8882", { bindings: {} });
}
