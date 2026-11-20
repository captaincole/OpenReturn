/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleG1FilingInfo } from "./filingInfo.js";
import type { ScheduleG1 } from "./types.js";

export function register(): void {
  defineForm<ScheduleG1, ScheduleG1FilingInfo>("schedule-g-1", { bindings: {} });
}
