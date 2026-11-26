/* Form 2555 rules: Parts I to III in answers.ts, Parts IV to IX in amounts.ts. */

import { defineForm, type FormSpec } from "../../defineForm.js";
import { SSN } from "../../values.js";
import { namesOnReturn } from "../returnNames.js";
import { amountBindings } from "./amounts.js";
import { answerBindings, filerOf } from "./answers.js";
import type { Form2555FilingInfo } from "./filingInfo.js";
import type { Form2555 } from "./types.js";

type Form2555Bindings = FormSpec<Form2555, Form2555FilingInfo>["bindings"];

export function register(): void {
  defineForm<Form2555, Form2555FilingInfo>("form-2555", {
    bindings: {
      // "Name shown on Form 1040 or 1040-SR": both names on a joint return.
      "0.header.taxpayer_name": (_, info) => namesOnReturn(info),
      // Each person's own form: the spouse's copy carries the spouse's number.
      "0.header.ssn": (_, info) =>
        filerOf(info)?.owner === "spouse" ? info.spouseSSN : info.taxpayerSSN,
      // The rows of lines 14 and 18 are built in loops, so the record's keys are strings.
      ...(answerBindings() as Form2555Bindings),
      ...(amountBindings() as Form2555Bindings),
    },

    // The SSN widget (text, maxLength 11) keeps the dashes.
    formatters: {
      "0.header.ssn": (value) => SSN.format(value as Parameters<typeof SSN.format>[0]),
    },
  });
}
