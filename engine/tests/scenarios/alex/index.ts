import type { Scenario } from "../../types.js";
import { alexDecisions } from "./decisions.js";
import { alex540Expected } from "./expected-540.js";
import { alexExpected } from "./expected.js";
import { ALEX_TAX_YEAR, ALEX_USER_ID, alexFacts } from "./facts.js";

export const alexScenario: Scenario = {
  name: "alex",
  description:
    "Single CA W-2 filer, $79k wages, standard deduction → $585 federal refund, $3 CA owed.",
  taxYear: ALEX_TAX_YEAR,
  userId: ALEX_USER_ID,
  facts: alexFacts,
  decisions: alexDecisions,
  forms: [
    {
      formId: "form-1040",
      goldenPdfPath: "tests/scenarios/alex/docs/Alex-1040-Golden.pdf",
      expected: alexExpected,
    },
    {
      formId: "form-540",
      goldenPdfPath: "tests/scenarios/alex/docs/Alex-CA540-Golden.pdf",
      expected: alex540Expected,
    },
  ],
};
