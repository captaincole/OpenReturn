/*
 * A made-up single filer in Texas (README.md): a resident alien student who
 * keeps a treaty exemption for part of her wages and discloses it on Form 8833
 * (the exempt amount on Schedule 1 line 8z). Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { irellaDecisions } from "./decisions.js";
import { irellaExpected } from "./expected.js";
import { IRELLA_TAX_YEAR, IRELLA_USER_ID, irellaFacts } from "./facts.js";

const FORM_IDS = ["form-8833", "schedule-1", "form-1040"];

export const irellaScenario: Scenario = {
  name: "irella",
  description:
    "Single TX filer, a resident alien student: a treaty exemption of $5,000 of wages disclosed on Form 8833 (one position, line 6 over nine rows), the exempt amount on Schedule 1 line 8z.",
  verification: "unverified",
  taxYear: IRELLA_TAX_YEAR,
  userId: IRELLA_USER_ID,
  facts: irellaFacts,
  decisions: irellaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: irellaExpected(formId),
    goldenPdfPath: lockedGoldenPath("irella", formId),
  })),
};
