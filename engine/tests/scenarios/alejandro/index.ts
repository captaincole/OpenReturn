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
  /*
   * The CPA's Schedule CA left line 3a column A blank; the instructions copy
   * federal line 3a there (ca-540-sched-ca-inst-2025::sec::section-a-line-1a-through-line-7a-and-section-b-line-1-through-line-9a::b01).
   * The engine follows the instructions; the CPA PDF stays as filed.
   */
  knownMismatches: {
    "schedule-ca.0.line.3a_federal":
      "The CPA's PDF leaves line 3a column A blank; the instructions copy federal line 3a ($381).",
  },
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
