/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleD1FilingInfo } from "./filingInfo.js";
import type { ScheduleD1 } from "./types.js";

export function register(): void {
  defineForm<ScheduleD1, ScheduleD1FilingInfo>("schedule-d-1", { bindings: {} });
}
