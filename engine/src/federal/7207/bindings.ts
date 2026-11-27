/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7207FilingInfo } from "./filingInfo.js";
import type { Form7207 } from "./types.js";

export function register(): void {
  defineForm<Form7207, Form7207FilingInfo>("form-7207", { bindings: {} });
}
