/*
 * One section 1043 conflict-of-interest sale fact → Part IV of Form 8824 and the
 * gain it sends to Schedule D (irs-8824-inst-2025::sec::section-1043-conflict-of-interest::b01).
 */

import type {
  ConflictOfInterestSaleFact,
  ConflictOfInterestSaleFactValue,
} from "../../facts/index.js";
import { heldMoreThanOneYear } from "../4797/dates.js";
import { TAX_YEAR, partIVLines, yearOf, type PartIVLines } from "./lines.js";
import { addAmount, emptyAmounts, type Destination, type RoutedAmounts } from "./routedAmounts.js";

export interface DivestitureForm {
  key: string;
  value: ConflictOfInterestSaleFactValue;
  /* Lines 30–38; undefined with the gap of lines 35–38. */
  lines?: PartIVLines;
  /* Lines 30–34, always figured. */
  line30: number;
  line31: number;
  line32: number;
  line33: number;
  line34: number;
  linesGap?: string;
  amounts: RoutedAmounts;
}

export type DivestitureOutcome =
  | { kind: "not_this_year" }
  | { kind: "gap"; key: string; reason: string; destinations: Destination[] }
  | { kind: "filed"; form: DivestitureForm };

const NOT_ELIGIBLE =
  'Part IV is completed "only if the cost of the replacement property is more than the basis of the divested property" for a sale at a gain (irs-8824-inst-2025::sec::section-1043-conflict-of-interest::b01, b02); otherwise the sale is reported on Schedule D or Form 4797, and the engine does not carry it from this fact.';
const BUSINESS_RECAPTURE =
  "Line 35 uses Part III of Form 4797 as a worksheet (irs-8824-inst-2025::sec::line-35::b01), and line 36 goes on Form 4797 line 2 or 10 (line-36::b01); the engine runs neither for divested business property.";

/*
 * Who files: a sale in 2025 under a certificate of divestiture whose deferral
 * the taxpayer elects. Line 36's capital gain goes on Schedule D (line-36::b01),
 * line 4 or 11 by the holding period (the Schedule D lines name Form 8824).
 * Line 35 is 0 for a capital asset: it has no depreciation to recapture.
 */
export function evaluateDivestiture({
  key,
  value,
}: ConflictOfInterestSaleFact): DivestitureOutcome {
  if (yearOf(value.dateSold) !== TAX_YEAR) return { kind: "not_this_year" };
  const proceeds = value.amountReceived - (value.sellingExpenses ?? 0);
  if (value.replacementCost <= value.basis || proceeds <= value.basis) {
    return {
      kind: "gap",
      key,
      reason: NOT_ELIGIBLE,
      destinations: [value.use === "investment" ? "schedule_d" : "form_4797"],
    };
  }
  const lines = partIVLines({
    amountReceived: value.amountReceived,
    sellingExpenses: value.sellingExpenses ?? 0,
    basis: value.basis,
    replacementCost: value.replacementCost,
    recapture: 0,
  });
  const head = {
    key,
    value,
    line30: lines.line30,
    line31: lines.line31,
    line32: lines.line32,
    line33: lines.line33,
    line34: lines.line34,
  };
  if (value.use === "business_or_rental") {
    return {
      kind: "filed",
      form: { ...head, linesGap: BUSINESS_RECAPTURE, amounts: emptyAmounts() },
    };
  }
  const longTerm = heldMoreThanOneYear(value.dateAcquired, value.dateSold);
  const amounts = addAmount(
    emptyAmounts(),
    longTerm ? "longTermCapital" : "shortTermCapital",
    lines.line36,
  );
  return { kind: "filed", form: { ...head, lines, amounts } };
}
