/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { ScheduleCFilingInfo } from "./filingInfo.js";
import type { ScheduleC } from "./types.js";

export function register(): void {
  defineForm<ScheduleC, ScheduleCFilingInfo>("schedule-c", { bindings: {} });
}
