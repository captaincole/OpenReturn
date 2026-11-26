/*
 * A made-up single filer in Texas (README.md): a cattle and hay ranch on the
 * cash method (Schedule F Parts I and II, a profit), CRP payments while on
 * social security (Schedule SE line 1b), the farm's QBI and its net
 * investment income adjustment. Federal only. UNVERIFIED: no answer key; the
 * expected values are engine output checked by hand, so a failure means "the
 * engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { daiseDecisions } from "./decisions.js";
import { daiseExpected } from "./expected.js";
import { DAISE_TAX_YEAR, DAISE_USER_ID, daiseFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
export const FORM_IDS = [
  "schedule-f",
  "schedule-se",
  "schedule-1",
  "schedule-b",
  "schedule-1-a",
  "form-8995-a",
  "form-8960",
  "schedule-2",
  "form-1040",
];

export const daiseScenario: Scenario = {
  name: "daise",
  description:
    "Single TX rancher on the cash method: Schedule F Parts I and II with a profit, CRP payments while on social security (Schedule SE line 1b), the farm on Schedule 1 line 6, QBI and Form 8960 line 4b.",
  verification: "unverified",
  taxYear: DAISE_TAX_YEAR,
  userId: DAISE_USER_ID,
  facts: daiseFacts,
  decisions: daiseDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: daiseExpected(formId),
    goldenPdfPath: lockedGoldenPath("daise", formId),
  })),
};
