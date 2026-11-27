/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8994FilingInfo } from "./filingInfo.js";
import type { Form8994 } from "./types.js";

export function register(): void {
  defineForm<Form8994, Form8994FilingInfo>("form-8994", { bindings: {} });
}
