/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Schedule8812FilingInfo } from "./filingInfo.js";
import type { Schedule8812 } from "./types.js";

export function register(): void {
  defineForm<Schedule8812, Schedule8812FilingInfo>("schedule-8812", { bindings: {} });
}
