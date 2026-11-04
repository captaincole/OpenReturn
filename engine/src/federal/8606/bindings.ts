/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8606FilingInfo, Form8606Person } from "./filingInfo.js";
import type { Form8606 } from "./types.js";

/* The person this copy is for. */
export function personOf(info: Form8606FilingInfo): Form8606Person | undefined {
  return info.form8606Persons?.[info.form8606CopyIndex ?? 0];
}

export function register(): void {
  defineForm<Form8606, Form8606FilingInfo>("form-8606", { bindings: {} });
}
