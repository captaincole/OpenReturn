/*
 * Scenario type — the contract every test scenario implements.
 *
 * A Scenario bundles its inputs (facts + decisions) with its expected
 * outputs (engine field values + rendered widget values). The shared
 * runner (runScenario.ts) takes one and produces a RunResult.
 *
 * To add a scenario: create tests/scenarios/<name>/{facts,decisions,
 * expected,index}.ts in the Alex pattern, export a Scenario from
 * index.ts, and add it to runAll.ts.
 */

import type { TaxFactRow } from "../src/mastra/db/taxFacts.js";
import type { AIDecisionRow } from "../src/mastra/db/aiDecisions.js";

export interface ScenarioForm {
  /**
   * Form to evaluate and assert against. The runner looks up the spec
   * (catalog path, blank PDF, register fn) in the shared registry
   * (`src/engine/registry.ts`). Scenarios do not repeat that config.
   */
  formId: string;
  /**
   * Path to a CPA-completed "golden" PDF for this scenario+form. The
   * runner reads every filled widget from this PDF and diffs against our
   * render. This bypasses the catalog's fieldId→widget mapping, so
   * catalog mislabels surface immediately. Optional; without it, only
   * the fixture-based assertions run. The path is scenario-specific, so
   * it lives here and not in the registry.
   */
  goldenPdfPath?: string;
  expected: ExpectedResults;
}

export interface Scenario {
  /** Short id used in CLI output (e.g. "alex"). Must be unique. */
  name: string;
  /** One-line human description for the summary banner. */
  description: string;
  taxYear: number;
  /** Stable id used as the synthetic user for these in-memory fixtures. */
  userId: string;
  facts: TaxFactRow[];
  decisions: AIDecisionRow[];
  /** Forms this scenario evaluates + asserts on. Order is reporting order. */
  forms: ScenarioForm[];
}

export interface ExpectedResults {
  /**
   * Engine field results: fieldId → expected numeric value. The runner
   * asserts each against the evaluated form's typed numeric result.
   * Use this for line values (1z, 12e, 15, 16, 34, …).
   */
  engineFields: Record<string, number>;

  /**
   * Rendered text widgets: fieldId → expected string written to the PDF
   * widget. Money values render as integer strings (fmtMoney). Text
   * fields render verbatim, with one exception: when an SSN/phone-style
   * value is longer than the widget's maxLength, the renderer strips the
   * separators. Write the post-render form here (e.g. "123456789", not
   * "123-45-6789").
   */
  renderedText: Record<string, string>;

  /**
   * Field ids that MUST NOT have a rendered widget at all. Use for lines
   * that must stay blank (e.g. the fiscal-year header dates that only
   * non-calendar filers fill).
   */
  renderedBlank: string[];

  /**
   * Field ids whose multi_select binding must produce at least one
   * checked widget. This does not pin a specific option; it proves the
   * rule mapped the decision to a PDF checkbox.
   */
  renderedChecked: string[];
}

export interface RunResult {
  name: string;
  passed: boolean;
  failures: string[];
  /** Scenario duration in ms. Useful for pre-commit budgeting. */
  durationMs: number;
  /** Fixpoint passes the engine needed for cross-form refs to settle. */
  fixpointPasses?: number;
  /** Newly resolved `ok` results per pass. The last entry must be 0 (convergence). */
  resolvedPerPass?: number[];
}
