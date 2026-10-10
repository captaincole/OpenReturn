/*
 * ScheduleDFilingInfo — Schedule D (Capital Gains and Losses) specific
 * slots layered on top of BaseFilingInfo.
 *
 * Schedule D is almost entirely a summarizer over 8949. It reads the
 * Part I / Part II totals via cross-form references, then nets them
 * into line 16, the value Form 1040 line 7a consumes. The arithmetic
 * needs no FilingInfo slots; only the form-scoping flag lives here.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";

export interface ScheduleDFilingInfo extends BaseFilingInfo {
  /**
   * Schedule D must-file determination. Driven by
   * `decisions.scope.must_file_schedule_d`. True when the taxpayer has
   * any capital gain or loss to report: 8949 transactions, capital-gain
   * distributions (1099-DIV box 2a), partnership/S-corp pass-through
   * gains, and similar.
   */
  mustFileScheduleD?: boolean;
  /** Provenance for mustFileScheduleD — populated by resolveFilingInfo. */
  mustFileScheduleDDerivation?: EngineDerivation;
}
