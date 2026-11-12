/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm } from "../../defineForm.js";
import type { ScheduleEFilingInfo } from "./filingInfo.js";
import type { ScheduleE } from "./types.js";

export function register(): void {
  defineForm<ScheduleE, ScheduleEFilingInfo>("schedule-e", { bindings: {} });
}
