/*
 * TaxCalcBench ty25-us-009 (README.md): an MFS filer in Florida, born 1951, who
 * lived with the spouse, with a W-2, interest, dividends, two self-rentals and a
 * passive royalty. Federal only.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbUs009Decisions } from "./decisions.js";
import { tcbUs009Expected } from "./expected.js";
import { TCB_US_009_TAX_YEAR, TCB_US_009_USER_ID, tcbUs009Facts } from "./facts.js";

const FORM_IDS = [
  "form-8582",
  "schedule-e",
  "form-8959",
  "form-8960",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "form-1040",
];

/*
 * MFS spouses who lived together use Part V, not Part IV
 * (irs-8582-inst-2025::sec::part-iv-2::b01); the key puts property A in Part IV (README).
 */
const PART_V_NOT_IV =
  "MFS and lived with the spouse: the instructions put property A in Part V (part-iv-2::b01); the key uses Part IV.";

const KNOWN_MISMATCHES: Record<string, string> = Object.fromEntries(
  [
    "form-8582.0.line.1b_rental_net_loss",
    "form-8582.0.line.1d_rental_combined",
    "form-8582.0.line.2d_other_combined",
    "form-8582.0.part4.row_1_col_b_net_loss",
    "form-8582.0.part4.row_1_col_e_loss",
    "form-8582.0.part4.total_col_b_net_loss",
    "form-8582.1.part5.row_1_col_a_net_income",
    "form-8582.1.part5.row_1_col_d_gain",
  ].map((fieldId) => [fieldId, PART_V_NOT_IV]),
);

export const tcbUs009Scenario: Scenario = {
  name: "tcb-us-009",
  description:
    "MFS FL filer, 65+, lived with the spouse: W-2, self-rental loss and income, a passive royalty (Schedule E, 8582), Form 8995 (TaxCalcBench).",
  taxYear: TCB_US_009_TAX_YEAR,
  userId: TCB_US_009_USER_ID,
  knownMismatches: KNOWN_MISMATCHES,
  facts: tcbUs009Facts,
  decisions: tcbUs009Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbUs009Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-us-009", formId),
  })),
};
