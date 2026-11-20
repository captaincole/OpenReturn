/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8801FilingInfo } from "./filingInfo.js";
import type { Form8801 } from "./types.js";

export function register(): void {
  defineForm<Form8801, Form8801FilingInfo>("form-8801", { bindings: {} });
}
