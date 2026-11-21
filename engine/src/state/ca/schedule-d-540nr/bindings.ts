/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleD540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleD540NR } from "./types.js";

export function register(): void {
  defineForm<ScheduleD540NR, ScheduleD540NRFilingInfo>("schedule-d-540nr", { bindings: {} });
}
