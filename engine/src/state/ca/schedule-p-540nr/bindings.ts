/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleP540NRFilingInfo } from "./filingInfo.js";
import type { ScheduleP540NR } from "./types.js";

export function register(): void {
  defineForm<ScheduleP540NR, ScheduleP540NRFilingInfo>("schedule-p-540nr", { bindings: {} });
}
