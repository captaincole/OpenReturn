/*
 * A made-up single partner in Washington (README.md): a W-2, an early 401(k)
 * distribution, and a Form 8986 after an administrative adjustment request
 * that lowers her 2022 and raises her 2023 tax. Form 8978 line 14 is
 * negative: Schedule 3 line 6l takes it up to Form 1040 line 18, and Schedule
 * 2 line 17z takes the rest against the 10% additional tax. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { harineDecisions } from "./decisions.js";
import { harineExpected } from "./expected.js";
import { HARINE_TAX_YEAR, HARINE_USER_ID, harineFacts } from "./facts.js";

const FORM_IDS = ["form-8978", "schedule-2", "schedule-3", "form-1040"];

export const harineScenario: Scenario = {
  name: "harine",
  description:
    "Single WA partner: a W-2, an early 401(k) distribution and an AAR Form 8986 (Form 8978 AAR box, a negative line 14 on Schedule 3 line 6l and Schedule 2 line 17z, interest at the short-term rate plus 3%).",
  verification: "unverified",
  taxYear: HARINE_TAX_YEAR,
  userId: HARINE_USER_ID,
  facts: harineFacts,
  decisions: harineDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: harineExpected(formId),
    goldenPdfPath: lockedGoldenPath("harine", formId),
  })),
};
