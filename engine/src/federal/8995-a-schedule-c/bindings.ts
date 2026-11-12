/*
 * Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:.
 */

import { defineForm } from "../../defineForm.js";
import type { Form8995AScheduleCFilingInfo } from "./filingInfo.js";
import type { Form8995AScheduleC } from "./types.js";

export function register(): void {
  defineForm<Form8995AScheduleC, Form8995AScheduleCFilingInfo>("form-8995-a-schedule-c", {
    bindings: {},
  });
}
