/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form5329FilingInfo } from "./filingInfo.js";
import type { Form5329 } from "./types.js";

export function register(): void {
  defineForm<Form5329, Form5329FilingInfo>("form-5329", { bindings: {} });
}
