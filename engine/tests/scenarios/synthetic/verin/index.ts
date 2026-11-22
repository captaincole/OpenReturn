/*
 * Synthetic (README.md): a made-up Sacramento couple filing jointly who report
 * two daughters' interest and dividends on Form 8814 and on FTB 3803.
 * UNVERIFIED: no answer key; the expected values are engine output, checked
 * by hand against the forms and their instructions.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { verinDecisions } from "./decisions.js";
import { verinExpected } from "./expected.js";
import { VERIN_TAX_YEAR, VERIN_USER_ID, verinFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8814",
  "schedule-1",
  "schedule-8812",
  "form-1040",
  "schedule-ca",
  "form-3803",
  "form-540",
];

export const verinScenario: Scenario = {
  name: "verin",
  description:
    "MFJ Sacramento couple: one W-2, Form 8814 and FTB 3803 for two daughters; California taxes Oregon bond interest and not Treasury interest, so Schedule CA line 8z column C adds the difference (synthetic).",
  verification: "unverified",
  taxYear: VERIN_TAX_YEAR,
  userId: VERIN_USER_ID,
  facts: verinFacts,
  decisions: verinDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: verinExpected(formId),
    goldenPdfPath: lockedGoldenPath("verin", formId),
  })),
};
