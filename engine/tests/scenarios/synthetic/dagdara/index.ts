/*
 * A made-up single filer in Texas (README.md): a boat builder completes a
 * long-term contract in 2025, and the look-back method moves income between
 * 2023 and 2024. Form 8697 Part I owes interest on one year and refunds
 * interest on the other; the net goes to Schedule 2 line 17n. Federal only.
 * UNVERIFIED: no answer key; the expected values are engine output checked by
 * hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { dagdaraDecisions } from "./decisions.js";
import { dagdaraExpected } from "./expected.js";
import { DAGDARA_TAX_YEAR, DAGDARA_USER_ID, dagdaraFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "form-8995",
  "schedule-1",
  "form-8697",
  "schedule-2",
  "form-1040",
];

export const dagdaraScenario: Scenario = {
  name: "dagdara",
  description:
    "Single TX boat builder: a long-term contract completed in 2025; Form 8697 Part I owes interest for 2023 and refunds it for 2024, the net on Schedule 2 line 17n.",
  verification: "unverified",
  taxYear: DAGDARA_TAX_YEAR,
  userId: DAGDARA_USER_ID,
  facts: dagdaraFacts,
  decisions: dagdaraDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: dagdaraExpected(formId),
    goldenPdfPath: lockedGoldenPath("dagdara", formId),
  })),
};
