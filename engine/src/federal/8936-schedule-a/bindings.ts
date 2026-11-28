/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8936ScheduleAFilingInfo } from "./filingInfo.js";
import type { Form8936ScheduleA } from "./types.js";

export function register(): void {
  defineForm<Form8936ScheduleA, Form8936ScheduleAFilingInfo>("form-8936-schedule-a", {
    bindings: {},
  });
}
