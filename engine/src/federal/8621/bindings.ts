/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8621FilingInfo } from "./filingInfo.js";
import type { Form8621 } from "./types.js";

export function register(): void {
  defineForm<Form8621, Form8621FilingInfo>("form-8621", { bindings: {} });
}
