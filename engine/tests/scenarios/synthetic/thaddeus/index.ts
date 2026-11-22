/*
 * A made-up married couple in Washington (README.md): an Archer MSA with
 * contributions and distributions for each spouse, a Medicare Advantage MSA,
 * and per diem long-term care benefits (Form 8853 Sections A, B and C).
 * Federal only. UNVERIFIED: no answer key; the expected values are engine
 * output checked by hand, so a failure means "the engine changed".
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { thaddeusDecisions } from "./decisions.js";
import { thaddeusExpected } from "./expected.js";
import { THADDEUS_TAX_YEAR, THADDEUS_USER_ID, thaddeusFacts } from "./facts.js";

const FORM_IDS = ["form-8853", "schedule-1", "schedule-2", "schedule-1-a", "form-1040"];

export const thaddeusScenario: Scenario = {
  name: "thaddeus",
  description:
    "MFJ WA couple: Archer MSAs for both spouses, a Medicare Advantage MSA and per diem long-term care benefits (Form 8853 Sections A–C; Schedule 1 lines 8e and 23; Schedule 2 lines 17e and 17f).",
  verification: "unverified",
  taxYear: THADDEUS_TAX_YEAR,
  userId: THADDEUS_USER_ID,
  facts: thaddeusFacts,
  decisions: thaddeusDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: thaddeusExpected(formId),
    goldenPdfPath: lockedGoldenPath("thaddeus", formId),
  })),
};
