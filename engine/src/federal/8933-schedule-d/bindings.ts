/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933ScheduleDFilingInfo } from "./filingInfo.js";
import type { Form8933ScheduleD } from "./types.js";

export function register(): void {
  defineForm<Form8933ScheduleD, Form8933ScheduleDFilingInfo>("form-8933-schedule-d", {
    bindings: {},
  });
}
