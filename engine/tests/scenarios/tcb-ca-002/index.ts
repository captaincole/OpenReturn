/*
 * TaxCalcBench ty25-ca-002 (README.md): a head of household in Yuba County who is
 * blind, with a W-2, interest with an early withdrawal penalty, a gig business
 * (Schedule C), Social Security, educator expenses and a California extension
 * payment. The key is the CA return.
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { tcbCa002Decisions } from "./decisions.js";
import { tcbCa002Expected } from "./expected.js";
import { TCB_CA_002_TAX_YEAR, TCB_CA_002_USER_ID, tcbCa002Facts } from "./facts.js";

/* The federal forms are inputs to the CA return: evaluated, not checked (the case has no federal key). */
const FORM_IDS = [
  "schedule-b",
  "schedule-c",
  "schedule-se",
  "form-8995",
  "schedule-1",
  "schedule-2",
  "schedule-8812",
  "form-1040",
  "schedule-ca",
  "form-540",
  "form-3532",
];

export const tcbCa002Scenario: Scenario = {
  name: "tcb-ca-002",
  description:
    "HOH Yuba County filer, blind: W-2, interest with an early withdrawal penalty, gig Schedule C, Social Security, educator expenses, CA extension payment; CA 540 with FTB 3532 (TaxCalcBench).",
  taxYear: TCB_CA_002_TAX_YEAR,
  userId: TCB_CA_002_USER_ID,
  facts: tcbCa002Facts,
  decisions: tcbCa002Decisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tcbCa002Expected(formId),
    goldenPdfPath: lockedGoldenPath("tcb-ca-002", formId),
  })),
};
