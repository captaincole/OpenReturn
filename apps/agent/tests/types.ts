/*
 * Scenario type — the contract every test scenario implements.
 *
 * A Scenario bundles its inputs (facts + decisions) with its expected
 * outputs (engine field values + rendered widget values). The shared
 * runner (golden/runScenario.ts) takes one and produces a RunResult.
 *
 * To add a scenario: create tests/scenarios/<name>/{facts,decisions,
 * expected,index}.ts in the Alex pattern, export a Scenario from
 * index.ts, and add it to SCENARIOS in scenarios/index.ts.
 */

import type { ScheduleBRounding } from "../src/engine/federal/schedule-b/filingInfo.js";
import type { AIDecisionRow } from "../src/mastra/db/aiDecisions.js";
import type { TaxFactRow } from "../src/mastra/db/taxFacts.js";

export interface ScenarioForm {
  /**
   * Form to evaluate and assert against. The runner looks up the spec
   * (catalog path, blank PDF, register fn) in the shared registry
   * (`src/engine/registry.ts`). Scenarios do not repeat that config.
   */
  formId: string;
  /**
   * Path to a "golden" PDF for this scenario+form: the CPA's filled form,
   * or, for a locked scenario, the engine's unflattened output
   * (renderScenario --golden; see lockedGoldenPath). The
   * runner reads every filled widget from this PDF and diffs against our
   * render. This bypasses the catalog's fieldId→widget mapping, so
   * catalog mislabels surface immediately. Optional; without it, only
   * the fixture-based assertions run. The path is scenario-specific, so
   * it lives here and not in the registry.
   */
  goldenPdfPath?: string;
  expected: ExpectedResults;
}

/** Who prepared the filed return the expected values come from. */
export interface Preparer {
  /** A CPA, an enrolled agent, tax software, or the taxpayer by hand. */
  kind: "cpa" | "enrolled_agent" | "software" | "self";
  /** Firm or software name and version, e.g. "TurboTax Premier 2025". */
  name?: string;
  /**
   * How this preparer rounds where the IRS allows a choice. Absent means
   * the IRS rule. Passed to the engine by decisionsWithPreparerStyle.
   */
  rounding?: {
    /** Schedule B lines 2 and 6: "round_total" (IRS) or "sum_rounded_rows". */
    scheduleB?: ScheduleBRounding;
  };
}

export interface Scenario {
  /** Short id used in CLI output (e.g. "alex"). Must be unique. */
  name: string;
  /** One-line human description for the summary banner. */
  description: string;
  taxYear: number;
  /**
   * Who prepared the filed return behind `expected`. Explains rounding
   * and judgment calls in a comparison report. Absent for provisional
   * values (jordan).
   */
  preparer?: Preparer;
  /**
   * "unverified": no answer key (no CPA return, no filed-return check).
   * The expected values are hand-checked, locked engine output. The
   * scenario still runs in the full suite, and its summary line says
   * "unverified". Absent: the values come from a verified source.
   */
  verification?: "unverified";
  /** Stable id used as the synthetic user for these in-memory fixtures. */
  userId: string;
  facts: TaxFactRow[];
  decisions: AIDecisionRow[];
  /** Forms this scenario evaluates + asserts on. Order is reporting order. */
  forms: ScenarioForm[];
  /**
   * When true, an expected engine field whose result is `unsupported`
   * (no binding yet) is reported as "not modeled" instead of failing.
   * For roadmap scenarios only (jordan); the CPA-golden scenarios stay
   * strict so a regression to unsupported still fails.
   */
  allowNotModeled?: boolean;
  /**
   * Skip this scenario in the default run (pre-commit). It still runs
   * when named on the command line: npm test -- <name>.
   */
  skip?: boolean;
  /**
   * The ratchet: fieldId → cause for lines the engine computes but gets
   * wrong today. A listed mismatch is reported, not failed. A listed line
   * that now matches FAILS ("remove from knownMismatches"), so the list
   * only shrinks. Requires allowNotModeled (roadmap scenarios only).
   */
  knownMismatches?: Record<string, string>;
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
   * widget. Money values render as whole-dollar strings (formatDollars). Text
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
  /**
   * Expected engine fields whose result is `unsupported` (no binding
   * yet). Only collected for scenarios with allowNotModeled; they do not
   * fail the run. One entry per line: "[formId] fieldId (expected N)".
   */
  notModeled?: string[];
  /** Listed known mismatches that still mismatch: "[formId] fieldId — cause". */
  knownMismatches?: string[];
}
