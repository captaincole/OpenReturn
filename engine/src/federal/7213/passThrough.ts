/*
 * The separate Form 7213 for the K-1 credits. A taxpayer whose only source is
 * a K-1 does not file the form: "Report your share of the section 45J or
 * section 45U credit on Form 3800" (irs-7213-inst-2025::sec::who-must-file::b01),
 * and "If the only credit allocated to you is the zero-emission nuclear power
 * production credit, do not report the credit on Form 7213" (line-12::b01).
 * A taxpayer who also claims a facility's credit in a part files a separate
 * form for that part's K-1 credits: "Enter 'Credit From Pass-Through
 * Entities' on line 1 of Part I and report the credit amount on line 8"
 * (line-10::b01), and "Credits From Pass-Through Entities" on Part II line 2a
 * with the amount on line 12 (line-12::b01). Form 3800 holds each K-1 credit
 * as its own source (3800/k1Credits.ts), so this copy only prints them.
 */

import { roundDollars, sum } from "../../money.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported } from "../../types.js";
import { k1EntitiesWithRoute, type ReceivedItem } from "../passThrough/receipts.js";
import { withPrefix, type Cells, type CellValue, type Form7213Copy } from "./cells.js";
import { PART_I_SECTION_1, PART_II_SECTION_1 } from "./sectionOne.js";

export const PASS_THROUGH_COPY = "pass_through";
export const PART_I_PASS_THROUGH_NAME = "Credit From Pass-Through Entities";
export const PART_II_PASS_THROUGH_NAME = "Credits From Pass-Through Entities";

/* The K-1 details (passThrough box tables): box 15 (box 13) code B, and code A. */
export const ADVANCED_NUCLEAR_DETAIL = "advanced_nuclear";
export const ZERO_EMISSION_DETAIL = "zero_emission_nuclear";

const STATEMENT_GAP =
  "The K-1 prints STMT for a nuclear power production credit, and the K-1 fact does not hold the amount.";

/* The K-1 items of one credit on the return. */
export const k1NuclearItems = (inputs: ResolverInputs, detail: string): ReceivedItem[] =>
  k1EntitiesWithRoute(inputs, "form_3800").filter((received) => received.item.detail === detail);

/* Line 8 or 12: the K-1 credits in whole dollars, a gap for a K-1 with no amount, blank with none. */
export function k1CreditTotal(items: ReceivedItem[]): CellValue {
  if (items.length === 0) return undefined;
  if (items.some((received) => received.item.amount === undefined)) {
    return unsupported(STATEMENT_GAP);
  }
  return sum(...items.map((received) => roundDollars(received.item.amount ?? 0)));
}

function partICells(total: CellValue): Cells {
  return {
    ...withPrefix(PART_I_SECTION_1, { "1a_facility_name_line1": PART_I_PASS_THROUGH_NAME }),
    "0.part1_sec2.8_credit_from_pass_through_entities": total,
    // Line 9: "Total of lines 7 and 8"; this copy has no line 7.
    "0.part1_sec2.9_total_lines_7_and_8": total,
  };
}

function partIICells(total: CellValue): Cells {
  return {
    ...withPrefix(PART_II_SECTION_1, {
      "2a_facility_name_description": PART_II_PASS_THROUGH_NAME,
    }),
    "1.part2_sec2.12_credit_from_pass_through": total,
    // Line 13: "Total of lines 11 and 12"; this copy has no line 11.
    "1.part2_sec2.13_total_lines_11_12": total,
  };
}

/*
 * The pass-through copy, with the parts asked for (a part the taxpayer claims
 * a facility's credit in); undefined when those parts have no K-1 credit.
 */
export function passThroughCopy(
  inputs: ResolverInputs,
  parts: { advanced: boolean; zeroEmission: boolean },
): Form7213Copy | undefined {
  const advanced = parts.advanced
    ? k1CreditTotal(k1NuclearItems(inputs, ADVANCED_NUCLEAR_DETAIL))
    : undefined;
  const zeroEmission = parts.zeroEmission
    ? k1CreditTotal(k1NuclearItems(inputs, ZERO_EMISSION_DETAIL))
    : undefined;
  if (advanced === undefined && zeroEmission === undefined) return undefined;
  const cells: Cells = {
    ...(advanced !== undefined && partICells(advanced)),
    ...(zeroEmission !== undefined && partIICells(zeroEmission)),
  };
  return { key: PASS_THROUGH_COPY, cells, waiting: false };
}
