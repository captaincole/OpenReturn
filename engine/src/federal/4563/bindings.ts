/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form4563FilingInfo } from "./filingInfo.js";
import type { Form4563 } from "./types.js";

export function register(): void {
  defineForm<Form4563, Form4563FilingInfo>("form-4563", { bindings: {} });
}
