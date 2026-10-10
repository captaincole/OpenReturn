/*
 * Form8949FilingInfo — Form 8949 (Sales and Other Dispositions of
 * Capital Assets) specific slots layered on top of BaseFilingInfo.
 *
 * 8949 itemizes individual security sales. Each TradeFact maps 1:1 to a
 * row on the form.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import type { EngineDerivation } from "../../types.js";
import type { TradeFactValue } from "../../facts/index.js";

export interface Form8949FilingInfo extends BaseFilingInfo {
  /**
   * Form 8949 must-file determination. Driven by
   * `decisions.scope.must_file_8949`. True when reportable security
   * sales exist to itemize — in effect, whenever Schedule D is filed
   * and at least one transaction needs row-level reporting.
   */
  mustFile8949?: boolean;
  /** Provenance for mustFile8949 — populated by resolveFilingInfo. */
  mustFile8949Derivation?: EngineDerivation;

  /**
   * Trade facts partitioned by holding period for 8949 row assignment.
   * Each TradeFactValue maps 1:1 to a form row. Short-term trades fill
   * Part I rows in order; long-term trades fill Part II rows. The
   * arrays are empty when the taxpayer has no covered-security sales of
   * that type.
   *
   * Partition rule: held > 1 year (date_sold − date_acquired) ⇒
   * long-term, else short-term. This matches the IRC §1222 split.
   */
  shortTermTrades?: TradeFactValue[];
  longTermTrades?: TradeFactValue[];
}
