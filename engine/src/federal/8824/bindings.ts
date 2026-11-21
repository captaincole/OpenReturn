/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8824FilingInfo } from "./filingInfo.js";
import type { Form8824 } from "./types.js";

export function register(): void {
  defineForm<Form8824, Form8824FilingInfo>("form-8824", { bindings: {} });
}
