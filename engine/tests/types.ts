import type { AIDecisionRow, TaxFactRow } from "../src/facts/rows.js";
import type { ScheduleBRounding } from "../src/federal/schedule-b/filingInfo.js";

export interface ScenarioForm {
  formId: string;
  /** The CPA's filled form, or for a locked scenario the engine's unflattened output. */
  goldenPdfPath?: string;
  expected: ExpectedResults;
}

export interface Preparer {
  kind: "cpa" | "enrolled_agent" | "software" | "self";
  name?: string;
  /** Absent means the IRS rule. */
  rounding?: {
    scheduleB?: ScheduleBRounding;
  };
}

export interface Scenario {
  name: string;
  description: string;
  taxYear: number;
  preparer?: Preparer;
  /** "unverified": no answer key; the expected values are hand-checked, locked engine output. */
  verification?: "unverified";
  userId: string;
  facts: TaxFactRow[];
  decisions: AIDecisionRow[];
  forms: ScenarioForm[];
  /** Roadmap scenarios only: CPA-golden scenarios stay strict so a regression to unsupported fails. */
  allowNotModeled?: boolean;
  /** Still runs when named on the command line. */
  skip?: boolean;
  /**
   * The ratchet: a listed line that now matches FAILS, so the list only shrinks.
   * Requires allowNotModeled.
   */
  knownMismatches?: Record<string, string>;
}

export interface ExpectedResults {
  engineFields: Record<string, number>;

  /** The post-render text: an SSN/phone longer than maxLength loses its separators ("123456789"). */
  renderedText: Record<string, string>;

  renderedBlank: string[];

  /** At least one checked widget; does not pin a specific option. */
  renderedChecked: string[];
}

export interface RunResult {
  name: string;
  passed: boolean;
  failures: string[];
  durationMs: number;
  fixpointPasses?: number;
  /** The last entry must be 0 (convergence). */
  resolvedPerPass?: number[];
  notModeled?: string[];
  knownMismatches?: string[];
}
