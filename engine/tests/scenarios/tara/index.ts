/*
 * Tara scenario bundle — IRS ATS test scenario 1, moved to California.
 *
 * SOURCE. This is the IRS example (docs/irs-ats-2025-scenario-1.pdf)
 * with one change: the location. Tara moves from Cincinnati, OH to San
 * Jose, CA, and her W-2 state boxes move from GA to CA, so the scenario
 * also files Form 540. Every dollar amount and taxpayer name is the
 * IRS package's. docs/RELOCATION.md lists the changes, the invented
 * names, and the answers the package does not give.
 *
 * Input documents, one file each. 00-tara-cover.pdf is the IRS cover
 * page. The W-2s (01, 02) are the official 2025 IRS Copy B, filled with
 * the IRS pages' values and the San Jose address. The package gives
 * only the Schedule H and Form 5695 amounts, so we made the W-2 Tara
 * issued to her household employee (03, Copy D) and three contractor
 * invoices (04–06).
 *
 * UNVERIFIED. The IRS package is an e-file schema test, not an answer
 * key, and no CPA has prepared this return. The expected values are
 * the engine's output, checked by hand line by line (see expected.ts),
 * then locked. Treat a failure here as "the engine changed", not
 * "the engine is wrong", until a verified source exists.
 *
 *   npm test -- tara
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { taraDecisions } from "./decisions.js";
import { taraExpected } from "./expected.js";
import { TARA_TAX_YEAR, TARA_USER_ID, taraFacts } from "./facts.js";

/* Forms in dependency order, matching the registry. */
const FORM_IDS = [
  "schedule-h",
  "schedule-2",
  "form-5695",
  "schedule-3",
  "form-1040",
  "schedule-ca",
  "form-540",
];

export const taraScenario: Scenario = {
  name: "tara",
  description:
    "Single CA filer, two W-2s: household employee (Schedule H) and home energy improvements (Form 5695) (IRS ATS 1).",
  verification: "unverified",
  taxYear: TARA_TAX_YEAR,
  userId: TARA_USER_ID,
  facts: taraFacts,
  decisions: taraDecisions,
  allowNotModeled: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: taraExpected(formId),
    goldenPdfPath: lockedGoldenPath("tara", formId),
  })),
};
