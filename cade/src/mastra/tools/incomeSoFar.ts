import {
  evaluateScenario,
  type BaseFormField,
  type EvaluatedForm,
  type EvaluatedScenario,
} from "@openreturn/engine";
import { numericField } from "./caseState";

/*
 * A running total of income for the web app, from the draft Form 1040's
 * income lines. It is progress, not a result: it shows while questions are
 * still open, so a line the engine cannot compute yet counts as 0. Cade does
 * not get it; his money values stay null until nothing is pending.
 */
export interface IncomeSoFar {
  wages: number;
  interest: number;
  dividends: number;
  capitalGains: number;
  /* Retirement, Social Security and Schedule 1 income. */
  other: number;
  total: number;
}

const MUST_FILE_FEDERAL = "decisions.scope.must_file_federal";
const OTHER_LINES = ["line.4b", "line.5b", "line.6b", "line.8"];

/*
 * The engine gives Form 1040 no lines until someone decided that the taxpayer
 * files a federal return. Documents often come before that decision, so the
 * running total takes it as yes until it is made.
 */
function draft1040(scenario: EvaluatedScenario): EvaluatedForm<BaseFormField> {
  const decided = scenario.decisions.some((row) => row.decisionKey === MUST_FILE_FEDERAL);
  if (decided) return scenario.forms.get("form-1040")!;
  const assumed: EvaluatedScenario["decisions"][number] = {
    id: "income-so-far",
    userId: "",
    taxYear: scenario.filing.taxYear,
    decisionKey: MUST_FILE_FEDERAL,
    decision: true,
    rationale: "Taken as yes for the running income total only. Never stored.",
    supportingFactKeys: [],
    confidence: "low",
    dissentingConsiderations: null,
    authorityCitations: null,
    sourceNote: null,
    createdAt: "",
    verdict: null,
    verdictReason: null,
    verdictAt: null,
  };
  const withFederal = evaluateScenario({
    filing: scenario.filing,
    facts: scenario.facts,
    assumptions: scenario.assumptionsInUse,
    decisions: [...scenario.decisions, assumed],
    authEmail: scenario.authEmail,
  });
  return withFederal.forms.get("form-1040")!;
}

export function incomeSoFar(scenario: EvaluatedScenario): IncomeSoFar {
  const { fields } = draft1040(scenario);
  const line = (id: string) => numericField(fields, `form-1040.${id}`) ?? 0;
  const wages = line("line.1z");
  const interest = line("line.2b");
  const dividends = line("line.3b");
  const capitalGains = line("line.7a");
  const other = OTHER_LINES.map(line).reduce((sum, value) => sum + value, 0);
  return {
    wages,
    interest,
    dividends,
    capitalGains,
    other,
    total: wages + interest + dividends + capitalGains + other,
  };
}
