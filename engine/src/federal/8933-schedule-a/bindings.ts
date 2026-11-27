/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933ScheduleAFilingInfo } from "./filingInfo.js";
import type { Form8933ScheduleA } from "./types.js";

export function register(): void {
  defineForm<Form8933ScheduleA, Form8933ScheduleAFilingInfo>("form-8933-schedule-a", {
    bindings: {},
  });
}
