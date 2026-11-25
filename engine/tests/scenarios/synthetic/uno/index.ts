/*
 * A made-up single filer in Fresno, California (README.md): a W-2 and a
 * payment in 2025 on a lot he sold to his sister in 2023. FTB 3805E prints only
 * Part II (and Part III's questions) in a year after the sale. A higher
 * California basis gives a lower gross profit percentage, so Schedule D (540)
 * line 12a goes to Schedule CA line 7a column B. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { unoDecisions } from "./decisions.js";
import { unoExpected } from "./expected.js";
import { UNO_TAX_YEAR, UNO_USER_ID, unoFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-6252",
  "schedule-d",
  "form-1040",
  "form-3805e",
  "schedule-d-ca",
  "schedule-ca",
  "form-540",
];

export const unoScenario: Scenario = {
  name: "uno",
  description:
    "Single CA filer: a 2025 payment on a lot sold to his sister in 2023 (FTB 3805E Part II and Part III questions; a higher California basis gives Schedule D (540) line 12a).",
  verification: "unverified",
  taxYear: UNO_TAX_YEAR,
  userId: UNO_USER_ID,
  facts: unoFacts,
  decisions: unoDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: unoExpected(formId),
    goldenPdfPath: lockedGoldenPath("uno", formId),
  })),
};
