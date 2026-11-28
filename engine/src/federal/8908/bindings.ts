/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8908FilingInfo } from "./filingInfo.js";
import type { Form8908 } from "./types.js";

export function register(): void {
  defineForm<Form8908, Form8908FilingInfo>("form-8908", { bindings: {} });
}
