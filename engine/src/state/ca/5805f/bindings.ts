/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form5805FFilingInfo } from "./filingInfo.js";
import type { Form5805F } from "./types.js";

export function register(): void {
  defineForm<Form5805F, Form5805FFilingInfo>("form-5805f", { bindings: {} });
}
