/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8615FilingInfo } from "./filingInfo.js";
import type { Form8615 } from "./types.js";

export function register(): void {
  defineForm<Form8615, Form8615FilingInfo>("form-8615", { bindings: {} });
}
