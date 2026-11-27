/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8846FilingInfo } from "./filingInfo.js";
import type { Form8846 } from "./types.js";

export function register(): void {
  defineForm<Form8846, Form8846FilingInfo>("form-8846", { bindings: {} });
}
