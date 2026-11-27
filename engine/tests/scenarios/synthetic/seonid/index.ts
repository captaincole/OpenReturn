/*
 * Made-up taxpayer (README.md): a single full-year California resident who
 * invests in, and works for, an S corporation in the former Harbor Gateway
 * Communities enterprise zone. Her hiring credit carryover is more than the
 * tax on her zone wages, so the sales or use tax credit waits a year. With
 * the other state tax and PTE elective tax credits, Schedule P (540) Section
 * B2 line 16 takes the enterprise zone credit and Form 540 line 45 the three
 * credits. No answer key: the expected values are hand-checked, locked engine
 * output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { seonidDecisions } from "./decisions.js";
import { seonidExpected } from "./expected.js";
import { SEONID_TAX_YEAR, SEONID_USER_ID, seonidFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "form-8959",
  "schedule-2",
  "form-1040",
  "schedule-ca",
  "schedule-p",
  "form-3805z",
  "schedule-s",
  "form-3804-cr",
  "form-540",
];

export const seonidScenario: Scenario = {
  name: "seonid",
  description:
    "Single investor and employee of an S corporation in a former enterprise zone: a hiring credit carryover above the tax on her zone wages (FTB 3805Z Schedule Z line 9A column (e) of 0), Schedule P (540) line 16 for code 176, then Utah tax and a PTE elective tax credit: Form 540 line 45.",
  taxYear: SEONID_TAX_YEAR,
  userId: SEONID_USER_ID,
  verification: "unverified",
  facts: seonidFacts,
  decisions: seonidDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: seonidExpected(formId),
    goldenPdfPath: lockedGoldenPath("seonid", formId),
  })),
};
