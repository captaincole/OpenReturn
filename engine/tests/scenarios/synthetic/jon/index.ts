/*
 * A made-up single clinical researcher in Washington (README.md): a clinical
 * research practice on Schedule C that tests three orphan drugs and elects
 * the reduced credit, a Form 8932 credit on some of the same wages, and a
 * Schedule K-1 (Form 1065) with an orphan drug credit in box 15 code Z. Form
 * 8820 lines 1 to 4 and Part II, Form 3800 line 1h and Schedule 3 line 6a.
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { jonDecisions } from "./decisions.js";
import { jonExpected } from "./expected.js";
import { JON_TAX_YEAR, JON_USER_ID, jonFacts } from "./facts.js";

const FORM_IDS = [
  "form-8820",
  "form-3800",
  "schedule-c",
  "schedule-se",
  "schedule-e",
  "form-8995-a",
  "form-6251",
  "schedule-1",
  "form-8959",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const jonScenario: Scenario = {
  name: "jon",
  description:
    "Single WA clinical researcher: orphan drug credit with the reduced credit election (19.75%), a Form 8932 credit on the same wages (line 2b), a K-1 (Form 1065) code Z, three drugs in Part II; Form 8820 lines 1 to 4, Form 3800 line 1h, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: JON_TAX_YEAR,
  userId: JON_USER_ID,
  facts: jonFacts,
  decisions: jonDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: jonExpected(formId),
    goldenPdfPath: lockedGoldenPath("jon", formId),
  })),
};
