/*
 * TaxCalcBench ty25-ca-005 (README.md): a married couple in Los Angeles who itemize
 * on their California return: two W-2s, interest, dividends, a stock sale, an early
 * pension distribution, Social Security, mortgage interest, gifts, an incentive stock
 * option exercise (California alternative minimum tax). The key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa005Decisions } from "./decisions.js";
import { tcbCa005Expected } from "./expected.js";
import { TCB_CA_005_TAX_YEAR, TCB_CA_005_USER_ID, tcbCa005Facts } from "./facts.js";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "form-8949",
  "schedule-d",
  "schedule-b",
  "form-4952",
  "schedule-a",
  "form-8960",
  "schedule-2",
  "schedule-8812",
  "form-1040",
  "schedule-ca",
  "form-3526",
  "form-3805p",
  "schedule-p",
  "form-540",
];

export const tcbCa005Scenario: Scenario = {
  name: "tcb-ca-005",
  description:
    "MFJ Los Angeles filers: W-2s, interest, dividends, 1099-B, early 1099-R, Social Security, Form 1098, gifts, ISO exercise; CA 540 with Schedule P AMT (TaxCalcBench).",
  taxYear: TCB_CA_005_TAX_YEAR,
  userId: TCB_CA_005_USER_ID,
  facts: tcbCa005Facts,
  decisions: tcbCa005Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa005Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-005", formId),
  })),
};
