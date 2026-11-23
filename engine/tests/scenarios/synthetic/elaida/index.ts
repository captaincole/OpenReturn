/*
 * A made-up married couple in Washington (README.md): one spouse's S
 * corporation K-1 with a loss larger than his stock basis, so Form 7203
 * allows each loss and deduction item in proportion and carries the rest to
 * 2026; the other spouse's two small Schedule C businesses; a W-2. Taxable
 * income is 0, and Form 8995 carries a qualified business loss forward.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { elaidaDecisions } from "./decisions.js";
import { elaidaExpected } from "./expected.js";
import { ELAIDA_TAX_YEAR, ELAIDA_USER_ID, elaidaFacts } from "./facts.js";

const FORM_IDS = [
  "schedule-c",
  "form-7203",
  "schedule-e",
  "schedule-d",
  "form-8995",
  "schedule-1",
  "form-1040",
];

export const elaidaScenario: Scenario = {
  name: "elaida",
  description:
    "MFJ WA couple: an S corporation K-1 whose loss, capital loss and charitable gift are more than the stock basis (Form 7203 allows each in proportion and carries the rest), two small Schedule C businesses, a W-2; taxable income 0 and a Form 8995 loss carryforward.",
  verification: "unverified",
  taxYear: ELAIDA_TAX_YEAR,
  userId: ELAIDA_USER_ID,
  facts: elaidaFacts,
  decisions: elaidaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: elaidaExpected(formId),
    goldenPdfPath: lockedGoldenPath("elaida", formId),
  })),
};
