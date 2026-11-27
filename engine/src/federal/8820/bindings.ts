/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8820FilingInfo } from "./filingInfo.js";
import type { Form8820 } from "./types.js";

export function register(): void {
  defineForm<Form8820, Form8820FilingInfo>("form-8820", { bindings: {} });
}
