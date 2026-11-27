/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933ScheduleEFilingInfo } from "./filingInfo.js";
import type { Form8933ScheduleE } from "./types.js";

export function register(): void {
  defineForm<Form8933ScheduleE, Form8933ScheduleEFilingInfo>("form-8933-schedule-e", {
    bindings: {},
  });
}
