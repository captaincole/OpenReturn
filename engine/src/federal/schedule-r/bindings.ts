/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { ScheduleRFilingInfo } from "./filingInfo.js";
import type { ScheduleR } from "./types.js";

export function register(): void {
  defineForm<ScheduleR, ScheduleRFilingInfo>("schedule-r", { bindings: {} });
}
