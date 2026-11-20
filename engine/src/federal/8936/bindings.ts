/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8936FilingInfo } from "./filingInfo.js";
import type { Form8936 } from "./types.js";

export function register(): void {
  defineForm<Form8936, Form8936FilingInfo>("form-8936", { bindings: {} });
}
