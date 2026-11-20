/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4797FilingInfo } from "./filingInfo.js";
import type { Form4797 } from "./types.js";

export function register(): void {
  defineForm<Form4797, Form4797FilingInfo>("form-4797", { bindings: {} });
}
