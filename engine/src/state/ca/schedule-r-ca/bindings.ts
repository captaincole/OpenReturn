/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleRCaFilingInfo } from "./filingInfo.js";
import type { ScheduleRCa } from "./types.js";

export function register(): void {
  defineForm<ScheduleRCa, ScheduleRCaFilingInfo>("schedule-r-ca", { bindings: {} });
}
