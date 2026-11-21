/*
 * A made-up single filer in Florida (README.md): a W-2, a Form 1098, a Mortgage
 * Credit Certificate with credit carried forward from 2024 (Form 8396), and
 * attic insulation (Form 5695 Part II). She itemizes. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { linneaDecisions } from "./decisions.js";
import { linneaExpected } from "./expected.js";
import { LINNEA_TAX_YEAR, LINNEA_USER_ID, linneaFacts } from "./facts.js";

const FORM_IDS = ["form-5695", "form-8396", "schedule-3", "schedule-a", "form-1040"];

export const linneaScenario: Scenario = {
  name: "linnea",
  description:
    "Single FL filer: a W-2, a Form 1098 and a Mortgage Credit Certificate with carryforwards (Form 8396, Schedule 3 line 6g, Schedule A line 8a), and insulation (Form 5695).",
  verification: "unverified",
  taxYear: LINNEA_TAX_YEAR,
  userId: LINNEA_USER_ID,
  facts: linneaFacts,
  decisions: linneaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: linneaExpected(formId),
    goldenPdfPath: lockedGoldenPath("linnea", formId),
  })),
};
