/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8833FilingInfo } from "./filingInfo.js";
import type { Form8833 } from "./types.js";

export function register(): void {
  defineForm<Form8833, Form8833FilingInfo>("form-8833", { bindings: {} });
}
