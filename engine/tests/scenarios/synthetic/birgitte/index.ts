/*
 * A made-up single filer in Washington (README.md): a new electric car and a
 * used one, each with its credit transferred to the dealer. Her modified AGI is
 * over both limits for 2024 and 2025, so both credits are repaid: Schedule 2
 * lines 1b and 1c. Federal only. UNVERIFIED: no answer key; the expected values
 * are engine output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { birgitteDecisions } from "./decisions.js";
import { birgitteExpected } from "./expected.js";
import { BIRGITTE_TAX_YEAR, BIRGITTE_USER_ID, birgitteFacts } from "./facts.js";

const FORM_IDS = ["form-8936", "schedule-2", "form-1040"];

export const birgitteScenario: Scenario = {
  name: "birgitte",
  description:
    "Single WA filer: a new and a previously owned clean vehicle, each credit transferred to the dealer; modified AGI over the limits both years, so both are repaid (Form 8936 Part I; Schedule 2 lines 1b and 1c).",
  verification: "unverified",
  taxYear: BIRGITTE_TAX_YEAR,
  userId: BIRGITTE_USER_ID,
  facts: birgitteFacts,
  decisions: birgitteDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: birgitteExpected(formId),
    goldenPdfPath: lockedGoldenPath("birgitte", formId),
  })),
};
