/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8958FilingInfo } from "./filingInfo.js";
import type { Form8958 } from "./types.js";

export function register(): void {
  defineForm<Form8958, Form8958FilingInfo>("form-8958", { bindings: {} });
}
