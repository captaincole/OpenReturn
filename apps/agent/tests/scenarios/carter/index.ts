/*
 * Carter scenario bundle — IRS ATS test scenario 8, moved to California.
 *
 * SOURCE. This is the IRS example (docs/irs-ats-2025-scenario-8.pdf)
 * with one change: the location. The taxpayer and the 1099-R recipient
 * address move from Las Vegas, NV to Sacramento, CA, so the scenario
 * also files Form 540. Every dollar amount, date, and taxpayer name is
 * the IRS package's. docs/RELOCATION.md lists the change, the invented
 * 1099-DIV payer name, and the California answers the package does not
 * give.
 *
 * The input documents are split out of the IRS PDF, one file each:
 * 00-carter-cover.pdf (DOB, Social Security, REIT distribution, lived
 * apart), 01-…-1099-r-code-q.pdf, and 02-…-1099-r-code-g.pdf. The
 * split pages are unchanged, so they still show the Nevada address.
 * The package has no 1099-DIV or SSA-1099, only their amounts on the
 * cover; we made 03-…-1099-div.pdf and 04-ssa-1099.pdf from them.
 *
 * UNVERIFIED. The IRS package is an e-file schema test, not an answer
 * key, and no CPA has prepared this return. The expected values are
 * the engine's output, checked by hand line by line (see expected.ts),
 * then locked. Treat a failure here as "the engine changed", not
 * "the engine is wrong", until a verified source exists.
 *
 *   npm test -- carter
 */

import { lockedGoldenPath } from "../../helpers/scenarioPdfName.js";
import type { Scenario } from "../../types.js";
import { carterDecisions } from "./decisions.js";
import { carterExpected } from "./expected.js";
import { CARTER_TAX_YEAR, CARTER_USER_ID, carterFacts } from "./facts.js";

/* Forms in dependency order, matching the registry. */
const FORM_IDS = ["form-1040", "schedule-ca", "form-540"];

export const carterScenario: Scenario = {
  name: "carter",
  description:
    "MFS CA filer, born 1953: Roth and rollover 1099-Rs, capital gain distribution, Social Security (IRS ATS 8).",
  verification: "unverified",
  taxYear: CARTER_TAX_YEAR,
  userId: CARTER_USER_ID,
  facts: carterFacts,
  decisions: carterDecisions,
  allowNotModeled: true,
  forms: FORM_IDS.map((formId) => ({
    formId,
    expected: carterExpected(formId),
    goldenPdfPath: lockedGoldenPath("carter", formId),
  })),
};
