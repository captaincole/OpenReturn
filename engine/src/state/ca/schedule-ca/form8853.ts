/*
 * Schedule CA (540) lines that copy federal amounts from Form 8853: line 8e,
 * "the total amounts from federal Form 8853 ... line 8, line 12, and line 26"
 * (ftb-pub-737-2025::sec::line-8e::b01), and line 23, the Archer MSA deduction
 * (ftb-pub-737-2025::sec::line-23::b01). California follows federal law on MSA
 * contributions and deductions (ftb-pub-1005-2025::sec::archer-medical-savings-accounts::b01),
 * so line 23 has no column B or C. Without Form 8853 each line keeps the reason
 * it had before the form had rules.
 */

import type { FormSpec } from "../../../defineForm.js";
import { files8853, form8853Total } from "../../../federal/8853/results.js";
import { numberOrBlank } from "../../../money.js";
import { unsupported } from "../../../types.js";
import type { ScheduleCaFilingInfo } from "./filingInfo.js";
import type { ScheduleCa } from "./types.js";

type Bindings = FormSpec<ScheduleCa, ScheduleCaFilingInfo>["bindings"];

const NO_FORM_8853_LINE_8E =
  "Income from federal Form 8853 (Archer MSAs and Long-Term Care Insurance Contracts) — no fact ingestion path for Form 8853 data exists yet.";
const NO_FORM_8853_LINE_23 =
  "Archer MSA deduction (federal Schedule 1 line 23, from Form 8853) — no Archer MSA fact ingestion path exists; uncommon scenario not yet modeled.";

export const form8853Bindings: Bindings = {
  "1.line.b8e_federal": (form, info) => {
    if (!files8853(info)) return unsupported(NO_FORM_8853_LINE_8E);
    const total = form8853Total(info, [
      "0.line.8_taxable_archer_msa_distributions",
      "0.line.12_taxable_medicare_advantage_distributions",
      "1.line.26_taxable_payments",
    ]);
    return typeof total === "object" ? total : numberOrBlank(form["schedule-1.0.line.8e"]);
  },
  "2.line.c23_federal": (form, info) => {
    if (!files8853(info)) return unsupported(NO_FORM_8853_LINE_23);
    const total = form8853Total(info, ["0.line.5_archer_msa_deduction"]);
    return typeof total === "object" ? total : numberOrBlank(form["schedule-1.1.line.23"]);
  },
};
