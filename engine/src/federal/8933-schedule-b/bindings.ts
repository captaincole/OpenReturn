/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933ScheduleBFilingInfo } from "./filingInfo.js";
import type { Form8933ScheduleB } from "./types.js";

export function register(): void {
  defineForm<Form8933ScheduleB, Form8933ScheduleBFilingInfo>("form-8933-schedule-b", {
    bindings: {},
  });
}
