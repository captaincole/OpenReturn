/*
 * Form 8915-F, qualified disaster retirement plan distributions and
 * repayments, for 2021 and later disasters. The resolver figures each form
 * from its fact and the 1099-Rs (figure.ts); the bindings print one copy.
 */

import { defineForm } from "../../defineForm.js";
import { SSN } from "../../values.js";
import type { Form8915FFilingInfo } from "./filingInfo.js";
import { headerAndPartIBindings } from "./headerAndPartI.js";
import { laterPartsBindings } from "./laterParts.js";
import type { Form8915F } from "./types.js";

export function register(): void {
  defineForm<Form8915F, Form8915FFilingInfo>("form-8915-f", {
    bindings: {
      ...headerAndPartIBindings(),
      ...laterPartsBindings(),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
