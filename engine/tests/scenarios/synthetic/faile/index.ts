/*
 * A made-up single filer in Texas (README.md): foreign tax on a mutual fund and
 * on Canadian bonds, both on 1099s, $150 in all. The election applies: the
 * credit goes on Schedule 3 line 1 with no Form 1116. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { faileDecisions } from "./decisions.js";
import { faileExpected } from "./expected.js";
import { FAILE_TAX_YEAR, FAILE_USER_ID, faileFacts } from "./facts.js";

const FORM_IDS = ["schedule-3", "form-1040", "schedule-b"];

export const faileScenario: Scenario = {
  name: "faile",
  description:
    "Single TX filer with $150 of foreign tax on a 1099-DIV and a 1099-INT: the election to claim the credit without Form 1116 puts it on Schedule 3 line 1.",
  verification: "unverified",
  taxYear: FAILE_TAX_YEAR,
  userId: FAILE_USER_ID,
  facts: faileFacts,
  decisions: faileDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: faileExpected(formId),
    goldenPdfPath: lockedGoldenPath("faile", formId),
  })),
};
