/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { ScheduleFFilingInfo } from "./filingInfo.js";
import type { ScheduleF } from "./types.js";

export function register(): void {
  defineForm<ScheduleF, ScheduleFFilingInfo>("schedule-f", { bindings: {} });
}
