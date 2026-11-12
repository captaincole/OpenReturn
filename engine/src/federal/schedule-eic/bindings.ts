/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { ScheduleEICFilingInfo } from "./filingInfo.js";
import type { ScheduleEIC } from "./types.js";

export function register(): void {
  defineForm<ScheduleEIC, ScheduleEICFilingInfo>("schedule-eic", { bindings: {} });
}
