/*
 * Synthetic (README.md): a made-up Oakland couple filing jointly who report
 * their son's interest and dividends on Form 8814 and on FTB 3803.
 * UNVERIFIED: no answer key; the expected values are engine output, checked
 * by hand against the forms and their instructions.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { tomasDecisions } from "./decisions.js";
import { tomasExpected } from "./expected.js";
import { TOMAS_TAX_YEAR, TOMAS_USER_ID, tomasFacts } from "./facts.js";

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

export const tomasScenario: Scenario = {
  name: "tomas",
  description:
    "MFJ Oakland couple: one W-2, Form 8814 and FTB 3803 for one son whose Treasury bill interest California does not tax, so Schedule CA line 8z column B subtracts the difference (synthetic).",
  verification: "unverified",
  taxYear: TOMAS_TAX_YEAR,
  userId: TOMAS_USER_ID,
  facts: tomasFacts,
  decisions: tomasDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: tomasExpected(formId),
    goldenPdfPath: lockedGoldenPath("tomas", formId),
  })),
};
