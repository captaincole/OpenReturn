/*
 * A made-up single filer in Texas (README.md): a furniture shop in a historic
 * mill with a rooftop solar array (Form 3468 Part VI) and the mill's certified
 * rehabilitation (Part VII). Two Forms 3468, Form 3800 lines 4a and 4k, the
 * credit limit and Schedule 3 line 6a. Federal only. UNVERIFIED: no answer
 * key; the expected values are engine output checked by hand, so a failure
 * means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { aramDecisions } from "./decisions.js";
import { aramExpected } from "./expected.js";
import { ARAM_TAX_YEAR, ARAM_USER_ID, aramFacts } from "./facts.js";

const FORM_IDS = [
  "form-3468",
  "form-3800",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8959",
  "form-8995-a",
];

export const aramScenario: Scenario = {
  name: "aram",
  description:
    "Single TX filer with a furniture shop: rooftop solar (Form 3468 Part VI, low-income and bond lines) and a certified rehabilitation (Part VII) on two Forms 3468, Form 3800 lines 4a and 4k, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: ARAM_TAX_YEAR,
  userId: ARAM_USER_ID,
  facts: aramFacts,
  decisions: aramDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: aramExpected(formId),
    goldenPdfPath: lockedGoldenPath("aram", formId),
  })),
};
