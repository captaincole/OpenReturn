/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form1116FilingInfo } from "./filingInfo.js";
import type { Form1116 } from "./types.js";

export function register(): void {
  defineForm<Form1116, Form1116FilingInfo>("form-1116", { bindings: {} });
}
