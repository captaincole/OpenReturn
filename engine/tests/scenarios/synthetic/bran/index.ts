/*
 * A made-up single filer in Texas (README.md): an energy components plant run
 * as a sole proprietorship, one Form 7207 with every Part II row but line 6b,
 * Parts III and IV, a section 6418 transfer of part of the credit, Form 3800
 * line 1b and Schedule 3 line 6a. Federal only. UNVERIFIED: no answer key;
 * the expected values are engine output checked by hand, so a failure means
 * "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { branDecisions } from "./decisions.js";
import { branExpected } from "./expected.js";
import { BRAN_TAX_YEAR, BRAN_USER_ID, branFacts } from "./facts.js";

const FORM_IDS = [
  "form-7207",
  "form-3800",
  "form-6251",
  "schedule-3",
  "form-1040",
  "schedule-1",
  "schedule-2",
  "schedule-c",
  "schedule-se",
  "form-8959",
  "form-8995-a",
];

export const branScenario: Scenario = {
  name: "bran",
  description:
    "Single TX filer with an energy components plant: Form 7207 (solar, wind, vessels, inverters, electrode materials, batteries, critical minerals), a section 6418 transfer, Form 3800 line 1b, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: BRAN_TAX_YEAR,
  userId: BRAN_USER_ID,
  facts: branFacts,
  decisions: branDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: branExpected(formId),
    goldenPdfPath: lockedGoldenPath("bran", formId),
  })),
};
