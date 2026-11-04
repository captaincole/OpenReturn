/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Schedule1AFilingInfo } from "./filingInfo.js";
import type { FormSchedule1A } from "./types.js";

export function register(): void {
  defineForm<FormSchedule1A, Schedule1AFilingInfo>("schedule-1-a", { bindings: {} });
}
