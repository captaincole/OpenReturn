/*
 * A made-up single filer in Sacramento, California (README.md): a W-2 and two
 * installment sales of capital assets in 2025, so two Forms 6252 and two FTB
 * 3805E. Her home's amounts are the same on both returns; a vacant lot sold to
 * her brother, who resold it, has a lower California basis. Schedule D (540)
 * line 1 takes the FTB 3805E gains and line 12b the difference (Schedule CA
 * line 7a column C). UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jolineDecisions } from "./decisions.js";
import { jolineExpected } from "./expected.js";
import { JOLINE_TAX_YEAR, JOLINE_USER_ID, jolineFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-6252",
  "schedule-d",
  "form-8960",
  "schedule-2",
  "form-1040",
  "form-3805e",
  "schedule-d-ca",
  "schedule-ca",
  "form-540",
];

export const jolineScenario: Scenario = {
  name: "joline",
  description:
    "Single CA filer: a main home and a vacant lot sold on installments in 2025 (FTB 3805E, two copies; Part III resale by a brother; a lower California basis gives Schedule D (540) line 12b).",
  verification: "unverified",
  taxYear: JOLINE_TAX_YEAR,
  userId: JOLINE_USER_ID,
  facts: jolineFacts,
  decisions: jolineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jolineExpected(formId),
    goldenPdfPath: lockedGoldenPath("joline", formId),
  })),
};
