/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3805EFilingInfo } from "./filingInfo.js";
import type { Form3805E } from "./types.js";

export function register(): void {
  defineForm<Form3805E, Form3805EFilingInfo>("form-3805e", { bindings: {} });
}
