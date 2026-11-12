/* Drafted by the write-binding-rules skill. Mark hand edits with // MANUAL EDIT:. */

import { defineForm } from "../../defineForm.js";
import type { Form8962FilingInfo } from "./filingInfo.js";
import type { Form8962 } from "./types.js";

export function register(): void {
  defineForm<Form8962, Form8962FilingInfo>("form-8962", {
    bindings: {},
  });
}
