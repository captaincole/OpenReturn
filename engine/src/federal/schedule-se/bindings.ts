/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { ScheduleSEFilingInfo } from "./filingInfo.js";
import type { ScheduleSE } from "./types.js";

export function register(): void {
  defineForm<ScheduleSE, ScheduleSEFilingInfo>("schedule-se", { bindings: {} });
}
