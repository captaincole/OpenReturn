/*
 * Marcus Chen scenario bundle.
 *
 * Marcus is our higher-income archetype: single CA filer, $220k W-2
 * wages, HSA + 401(k) pre-tax payroll, itemized deductions under the
 * 2025 OBBBA SALT cap. The scenario exercises Schedule A, Form 8959, and
 * Form 1040. Schedule B (1099-INT plumbing), Schedule 2, Form 8889,
 * Form 8960, Schedule D, and the CA-side forms turn on as their bindings
 * land.
 */

import type { Scenario } from "../../types.js";
import { marcusDecisions } from "./decisions.js";
import { marcus8959Expected } from "./expected-8959.js";
import { marcusScheduleAExpected } from "./expected-schedule-a.js";
import { marcusExpected } from "./expected.js";
import { MARCUS_TAX_YEAR, MARCUS_USER_ID, marcusFacts } from "./facts.js";

export const marcusScenario: Scenario = {
  name: "marcus",
  description:
    "Single CA filer, $220k W-2 wages, itemized deductions (SALT-only $18,422) — exercises Schedule A + 1040 line 12e itemized flip.",
  taxYear: MARCUS_TAX_YEAR,
  userId: MARCUS_USER_ID,
  facts: marcusFacts,
  decisions: marcusDecisions,
  /*
   * Schedule A is listed before form-1040, so the engine evaluates it
   * first in pass 1. 1040 line 12e (itemized → Schedule A line 17) then
   * resolves in the same pass, without a fixpoint round-trip.
   */
  forms: [
    {
      formId: "schedule-a",
      goldenPdfPath: "tests/scenarios/marcus/docs/Marcus-ScheduleA-Golden.pdf",
      expected: marcusScheduleAExpected,
    },
    {
      formId: "form-8959",
      goldenPdfPath: "tests/scenarios/marcus/docs/Marcus-8959-Golden.pdf",
      expected: marcus8959Expected,
    },
    {
      formId: "form-1040",
      /*
       * No goldenPdfPath yet. The full 1040 will not match the CPA's
       * golden until brokerage (Schedule D) and Schedule 2 wiring land.
       */
      expected: marcusExpected,
    },
  ],
};
