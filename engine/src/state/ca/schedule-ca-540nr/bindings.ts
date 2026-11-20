/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleCa540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleCa540NR } from "./types.js";

export function register(): void {
  defineForm<ScheduleCa540NR, ScheduleCa540NRFilingInfo>("schedule-ca-540nr", { bindings: {} });
}
