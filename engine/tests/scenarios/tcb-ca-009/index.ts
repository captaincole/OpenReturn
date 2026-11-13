/*
 * TaxCalcBench ty25-ca-009 (README.md): a qualifying surviving spouse in California
 * who itemizes only on the California return: a W-2, interest, dividends, a stock
 * sale with a loss carryover, a pension, Social Security, an HSA, cash gifts and an
 * incentive stock option exercise (Schedule P (540)). The key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa009Decisions } from "./decisions.js";
import { tcbCa009Expected } from "./expected.js";
import { TCB_CA_009_TAX_YEAR, TCB_CA_009_USER_ID, tcbCa009Facts } from "./facts.js";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "schedule-b",
  "form-8889",
  "schedule-1",
  "schedule-a",
  "form-6251",
  "schedule-2",
  "schedule-8812",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-540",
];

export const tcbCa009Scenario: Scenario = {
  name: "tcb-ca-009",
  description:
    "QSS Californian, 65+: W-2, interest, dividends, 1099-B with a loss carryover, pension, Social Security, HSA (8889, two 1099-SAs), cash gifts, ISO exercise; CA 540 itemizes with Schedule P (TaxCalcBench).",
  taxYear: TCB_CA_009_TAX_YEAR,
  userId: TCB_CA_009_USER_ID,
  facts: tcbCa009Facts,
  decisions: tcbCa009Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa009Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-009", formId),
  })),
};
