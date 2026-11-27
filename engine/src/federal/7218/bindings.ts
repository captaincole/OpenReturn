/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7218FilingInfo } from "./filingInfo.js";
import type { Form7218 } from "./types.js";

export function register(): void {
  defineForm<Form7218, Form7218FilingInfo>("form-7218", { bindings: {} });
}
