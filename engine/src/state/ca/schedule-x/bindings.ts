/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleXFilingInfo } from "./filingInfo.js";
import type { ScheduleX } from "./types.js";

export function register(): void {
  defineForm<ScheduleX, ScheduleXFilingInfo>("schedule-x", { bindings: {} });
}
