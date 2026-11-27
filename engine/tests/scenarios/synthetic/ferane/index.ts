/*
 * A made-up single filer in Washington (README.md): the section 965
 * transition tax from 2017 to 2020 in its later installment years, a liability
 * assumed by transfer, a deferred S corporation liability triggered in 2022,
 * and the Part IV report of the deferrals still open (Form 965-A, Schedule 2
 * line 20). Federal only. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { feraneDecisions } from "./decisions.js";
import { feraneExpected } from "./expected.js";
import { FERANE_TAX_YEAR, FERANE_USER_ID, feraneFacts } from "./facts.js";

const FORM_IDS = ["form-965-a", "schedule-2", "form-1040"];

export const feraneScenario: Scenario = {
  name: "ferane",
  description:
    "Single WA filer: Form 965-A with 2017–2020 section 965 liabilities in later installment years, an audit adjustment, a liability assumed by transfer, a triggered S corporation deferral, Part III and Part IV (Schedule 2 line 20).",
  verification: "unverified",
  taxYear: FERANE_TAX_YEAR,
  userId: FERANE_USER_ID,
  facts: feraneFacts,
  decisions: feraneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: feraneExpected(formId),
    goldenPdfPath: lockedGoldenPath("ferane", formId),
  })),
};
