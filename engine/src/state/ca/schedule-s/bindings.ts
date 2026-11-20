/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../../defineForm.js";
import type { ScheduleSFilingInfo } from "./filingInfo.js";
import type { ScheduleS } from "./types.js";

export function register(): void {
  defineForm<ScheduleS, ScheduleSFilingInfo>("schedule-s", { bindings: {} });
}
