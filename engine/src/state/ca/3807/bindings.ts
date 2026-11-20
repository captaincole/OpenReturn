/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { Form3807FilingInfo } from "./filingInfo.js";
import type { Form3807 } from "./types.js";

export function register(): void {
  defineForm<Form3807, Form3807FilingInfo>("form-3807", { bindings: {} });
}
