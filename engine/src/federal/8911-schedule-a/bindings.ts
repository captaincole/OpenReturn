/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8911ScheduleAFilingInfo } from "./filingInfo.js";
import type { Form8911ScheduleA } from "./types.js";

export function register(): void {
  defineForm<Form8911ScheduleA, Form8911ScheduleAFilingInfo>("form-8911-schedule-a", {
    bindings: {},
  });
}
