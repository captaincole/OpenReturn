/*
 * A made-up single filer in Washington (README.md): a fee-basis county official
 * who is deaf, with two vehicles on actual expenses (one bought in 2025, one
 * leased) and a W-2 code L reimbursement to allocate. Form 2106 line 10 splits
 * between Schedule 1 line 12 and Schedule A line 16. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { aviendhaDecisions } from "./decisions.js";
import { aviendhaExpected } from "./expected.js";
import { AVIENDHA_TAX_YEAR, AVIENDHA_USER_ID, aviendhaFacts } from "./facts.js";

const FORM_IDS = ["form-2106", "schedule-1", "schedule-a", "form-1040"];

export const aviendhaScenario: Scenario = {
  name: "aviendha",
  description:
    "Single WA filer, a fee-basis county official who is deaf: Form 2106 with two vehicles, section 179 and the special allowance, a code L allocation; line 10 split between Schedule 1 line 12 and Schedule A line 16.",
  verification: "unverified",
  taxYear: AVIENDHA_TAX_YEAR,
  userId: AVIENDHA_USER_ID,
  facts: aviendhaFacts,
  decisions: aviendhaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: aviendhaExpected(formId),
    goldenPdfPath: lockedGoldenPath("aviendha", formId),
  })),
};
