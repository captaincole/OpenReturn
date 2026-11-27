/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { ScheduleJFilingInfo } from "./filingInfo.js";
import type { ScheduleJ } from "./types.js";

export function register(): void {
  defineForm<ScheduleJ, ScheduleJFilingInfo>("schedule-j", { bindings: {} });
}
