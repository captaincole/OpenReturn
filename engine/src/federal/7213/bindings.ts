/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7213FilingInfo } from "./filingInfo.js";
import type { Form7213 } from "./types.js";

export function register(): void {
  defineForm<Form7213, Form7213FilingInfo>("form-7213", { bindings: {} });
}
