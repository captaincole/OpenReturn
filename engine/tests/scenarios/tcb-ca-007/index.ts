/*
 * TaxCalcBench ty25-ca-007 (README.md): a married person filing separately in Los
 * Angeles with three businesses (a Form 8829 home office, amortization), a
 * self-rental with a new asset (Form 4562, FTB 3885A), five 1099-Rs, a W-2G, many
 * Schedule 1 items and itemized deductions. The key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa007Decisions } from "./decisions.js";
import { tcbCa007Expected } from "./expected.js";
import { TCB_CA_007_TAX_YEAR, TCB_CA_007_USER_ID, tcbCa007Facts } from "./facts.js";

const WAITS_FOR_SECTION_C =
  "Schedule CA column A does not copy Schedule 1 line 3 or line 15 yet (PR #132 adds them).";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "form-4562",
  "form-8829",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "schedule-1",
  "form-8606",
  "form-4952",
  "schedule-a",
  "form-8995",
  "schedule-2",
  "schedule-8812",
  "schedule-eic",
  "form-1040",
  "form-3885a",
  "schedule-ca",
  "form-3526",
  "form-3805p",
  "form-540",
  "schedule-p",
];

export const tcbCa007Scenario: Scenario = {
  name: "tcb-ca-007",
  description:
    "MFS Los Angeles filer: three Schedule Cs (Form 8829, amortization), a self-rental asset (Form 4562, FTB 3885A), five 1099-Rs with a Roth distribution, W-2G, Schedule 1 items, itemized (TaxCalcBench).",
  taxYear: TCB_CA_007_TAX_YEAR,
  userId: TCB_CA_007_USER_ID,
  facts: tcbCa007Facts,
  decisions: tcbCa007Decisions,
  /*
   * Schedule CA line 3 and line 15 column A (and the totals that add them) are
   * another lane's work, PR #132; until it merges they stay blank here.
   */
  knownMismatches: {
    "schedule-ca.0.line.b3_federal": WAITS_FOR_SECTION_C,
    "schedule-ca.2.line.c15_federal": WAITS_FOR_SECTION_C,
    "schedule-ca.3.line.c26_federal": WAITS_FOR_SECTION_C,
    "schedule-ca.2.line.b10_federal": WAITS_FOR_SECTION_C,
    "schedule-ca.3.line.c27_federal": WAITS_FOR_SECTION_C,
  },
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa007Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-007", formId),
  })),
};
