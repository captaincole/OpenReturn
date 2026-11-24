/*
 * A made-up single taxpayer in Florida (README.md): two limited partner K-1s
 * (Form 1065), both passive. One has a business loss, the other rental
 * income. Form 8582 allows the loss only up to the passive income and
 * carries the rest to 2026; Schedule E line 28 shows the allowed loss in
 * column (g) and the income in column (h); Form 8995 counts only the allowed
 * part of the QBI loss and carries it forward. Federal only. UNVERIFIED: no
 * answer key; the expected values are engine output checked by hand, so a
 * failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { cadsuaneDecisions } from "./decisions.js";
import { cadsuaneExpected } from "./expected.js";
import { CADSUANE_TAX_YEAR, CADSUANE_USER_ID, cadsuaneFacts } from "./facts.js";

const FORM_IDS = ["form-8582", "schedule-e", "form-8995", "schedule-1", "form-1040"];

export const cadsuaneScenario: Scenario = {
  name: "cadsuane",
  description:
    "Single FL filer: two passive limited partner K-1s (Form 1065), a business loss and rental income; Form 8582 allows the loss up to the passive income and carries the rest; Schedule E columns (g) and (h); Form 8995 counts the allowed part of the QBI loss.",
  verification: "unverified",
  taxYear: CADSUANE_TAX_YEAR,
  userId: CADSUANE_USER_ID,
  facts: cadsuaneFacts,
  decisions: cadsuaneDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: cadsuaneExpected(formId),
    goldenPdfPath: lockedGoldenPath("cadsuane", formId),
  })),
};
