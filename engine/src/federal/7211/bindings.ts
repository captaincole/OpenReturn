/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form7211FilingInfo } from "./filingInfo.js";
import type { Form7211 } from "./types.js";

export function register(): void {
  defineForm<Form7211, Form7211FilingInfo>("form-7211", { bindings: {} });
}
