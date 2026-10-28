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
      // No goldenPdfPath until Schedule D and Schedule 2 wiring land.
      expected: marcusExpected,
    },
  ],
};
