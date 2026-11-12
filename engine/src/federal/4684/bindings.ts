/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4684FilingInfo } from "./filingInfo.js";
import type { Form4684 } from "./types.js";

export function register(): void {
  defineForm<Form4684, Form4684FilingInfo>("form-4684", { bindings: {} });
}
