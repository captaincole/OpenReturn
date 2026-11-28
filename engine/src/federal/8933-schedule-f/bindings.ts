/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933ScheduleFFilingInfo } from "./filingInfo.js";
import type { Form8933ScheduleF } from "./types.js";

export function register(): void {
  defineForm<Form8933ScheduleF, Form8933ScheduleFFilingInfo>("form-8933-schedule-f", {
    bindings: {},
  });
}
