/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7206FilingInfo } from "./filingInfo.js";
import type { Form7206 } from "./types.js";

export function register(): void {
  defineForm<Form7206, Form7206FilingInfo>("form-7206", { bindings: {} });
}
