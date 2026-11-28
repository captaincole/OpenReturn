/*
 * A made-up single short line railroad owner in Texas (README.md): a Class III
 * railroad on Schedule C that maintains its own track, assigns miles to a
 * shipper and is assigned miles by a connecting railroad, capitalizes part of
 * the work as rebuilt track, and a Schedule K-1 (Form 1120-S) with a railroad
 * track maintenance credit in box 13 code AJ. Form 8900 lines 1 to 7, the
 * credit off the track's Form 4562 basis, Form 3800 line 4g and Schedule 3
 * line 6a. Federal only. UNVERIFIED: no answer key; the expected values are
 * engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { niedaDecisions } from "./decisions.js";
import { niedaExpected } from "./expected.js";
import { NIEDA_TAX_YEAR, NIEDA_USER_ID, niedaFacts } from "./facts.js";

const FORM_IDS = [
  "form-8900",
  "form-3800",
  "schedule-c",
  "form-4562",
  "schedule-se",
  "schedule-e",
  "form-8995-a",
  "schedule-1",
  "form-8959",
  "schedule-2",
  "schedule-3",
  "form-1040",
];

export const niedaScenario: Scenario = {
  name: "nieda",
  description:
    "Single TX short line railroad owner: track maintenance expenditures, miles owned, assigned to a shipper and assigned to her, part capitalized as rebuilt track, a K-1 (Form 1120-S) code AJ; Form 8900 lines 1 to 7, the credit off the track's Form 4562 basis, Form 3800 line 4g, Schedule 3 line 6a.",
  verification: "unverified",
  taxYear: NIEDA_TAX_YEAR,
  userId: NIEDA_USER_ID,
  facts: niedaFacts,
  decisions: niedaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: niedaExpected(formId),
    goldenPdfPath: lockedGoldenPath("nieda", formId),
  })),
};
