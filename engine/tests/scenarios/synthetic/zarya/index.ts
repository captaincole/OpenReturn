/*
 * Made-up taxpayer (README.md): a single full-year California resident with
 * wages and a bakery in the former Tulare County Targeted Tax Area. FTB 3809
 * deducts her TTA NOL carryovers (Schedule CA (540) line 9b3) and takes her
 * TTA hiring credit with no Schedule P (540); Form 540 lines 43 and 44 hold it
 * and the Utah other state tax credit. No answer key: the expected values are
 * hand-checked, locked engine output.
 */

import { lockedGoldenPath } from "../../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../../types.js";
import { zaryaDecisions } from "./decisions.js";
import { zaryaExpected } from "./expected.js";
import { ZARYA_TAX_YEAR, ZARYA_USER_ID, zaryaFacts } from "./facts.js";

/* Every form the engine files for these facts, upstreams first. */
const FORM_IDS = [
  "schedule-c",
  "schedule-se",
  "schedule-1",
  "schedule-2",
  "form-8959",
  "form-8995-a",
  "form-1040",
  "schedule-ca",
  "form-3809",
  "schedule-s",
  "form-540",
];

export const zaryaScenario: Scenario = {
  name: "zarya",
  description:
    "Single Visalia engineer and bakery owner with TTA NOL and hiring credit carryovers (FTB 3809): Schedule CA (540) line 9b3, Form 540 lines 43 and 44 with the Utah other state tax credit, no Schedule P (540).",
  taxYear: ZARYA_TAX_YEAR,
  userId: ZARYA_USER_ID,
  verification: "unverified",
  facts: zaryaFacts,
  decisions: zaryaDecisions,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: zaryaExpected(formId),
    goldenPdfPath: lockedGoldenPath("zarya", formId),
  })),
};
