/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8933ScheduleCFilingInfo } from "./filingInfo.js";
import type { Form8933ScheduleC } from "./types.js";

export function register(): void {
  defineForm<Form8933ScheduleC, Form8933ScheduleCFilingInfo>("form-8933-schedule-c", {
    bindings: {},
  });
}
