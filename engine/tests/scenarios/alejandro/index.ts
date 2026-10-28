import type { Scenario } from "../../types.js";
import { alejandroDecisions } from "./decisions.js";
import { alejandro540Expected } from "./expected-540.js";
import { alejandro8949Expected } from "./expected-8949.js";
import { alejandroScheduleCaExpected } from "./expected-schedule-ca.js";
import { alejandroScheduleDExpected } from "./expected-schedule-d.js";
import { alejandroExpected } from "./expected.js";
import { ALEJANDRO_TAX_YEAR, ALEJANDRO_USER_ID, alejandroFacts } from "./facts.js";

export const alejandroScenario: Scenario = {
  name: "alejandro",
  description:
    "Single CA W-2 + 1099-DIV/B filer, $100k wages + $385 ordinary divs + $2,550 capital gain → $584 federal refund, $175 CA refund.",
  taxYear: ALEJANDRO_TAX_YEAR,
  userId: ALEJANDRO_USER_ID,
  facts: alejandroFacts,
  decisions: alejandroDecisions,
  forms: [
    {
      formId: "form-8949",
      expected: alejandro8949Expected,
      goldenPdfPath: "tests/scenarios/alejandro/docs/Alejandro-8949-Golden.pdf",
    },
    {
      formId: "schedule-d",
      expected: alejandroScheduleDExpected,
      goldenPdfPath: "tests/scenarios/alejandro/docs/Alejandro-ScheduleD-Golden.pdf",
    },
    {
      formId: "form-1040",
      expected: alejandroExpected,
      goldenPdfPath: "tests/scenarios/alejandro/docs/Alejandro-1040-Golden.pdf",
    },
    {
      formId: "schedule-ca",
      expected: alejandroScheduleCaExpected,
      goldenPdfPath: "tests/scenarios/alejandro/docs/Alejandro-ScheduleCA-Golden.pdf",
    },
    {
      formId: "form-540",
      expected: alejandro540Expected,
      goldenPdfPath: "tests/scenarios/alejandro/docs/Alejandro-CA540-Golden.pdf",
    },
  ],
};
