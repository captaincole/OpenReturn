/*
 * Form 4797 by the activity that used each property: a Schedule C business, a
 * rental, or neither. Form 8995 adds a business's ordinary part to its QBI
 * (qbi/form4797.ts), and Form 8960 line 5b takes out a nonpassive business's
 * whole gain or loss (8960/line5b.ts). Each amount is whole dollars.
 */

import {
  NO_BUSINESS,
  makeBusinessFactKey,
  makeRentalFactKey,
  type BusinessPropertySaleFactValue,
} from "../../facts/index.js";
import { sum } from "../../money.js";
import type { Form4797Lines } from "./lines.js";
import { recaptureOf, type PlacedProperty } from "./properties.js";

/* The activity of a property that no Schedule C business or rental used. */
export const NO_ACTIVITY = "none";

/*
 * The fact key of the activity a sale names (business.<id>, rental.property.<id>),
 * NO_ACTIVITY, or undefined when the sale names none.
 */
export function activityOf(sale: BusinessPropertySaleFactValue): string | undefined {
  if (sale.rentalId !== undefined) return makeRentalFactKey(sale.rentalId);
  if (sale.businessId === undefined) return undefined;
  return sale.businessId === NO_BUSINESS ? NO_ACTIVITY : makeBusinessFactKey(sale.businessId);
}

export interface ActivityAmounts {
  /* business.<id>, rental.property.<id>, or NO_ACTIVITY. */
  key: string;
  /* Its Part II rows, its Part III recapture (line 13's part) and its share of line 11 or 12. */
  ordinary: number;
  /* Every gain and loss of its properties (lines 2, 10 and 24): its part of Form 8960 line 5a. */
  total: number;
}

export interface Form4797Activities {
  /* One entry per activity that sold property, in fact order. */
  amounts: ActivityAmounts[];
  /*
   * Why the ordinary amounts are not known. It holds for each activity with an
   * entry, and for every activity when there is no entry (no sale could be read).
   */
  ordinaryGap?: string;
  /* Why the totals are not known, with the same reach. */
  totalGap?: string;
  /* A sale's activity is not answered, or the line 8 answer is missing: QBI and line 5b wait. */
  waiting: boolean;
}

export type LinkedProperty = PlacedProperty & { activity: string };

/* A Part I row, or a Part III column's line 24 less its recapture (its part of line 32 and line 6). */
function section1231Amount(property: PlacedProperty): number {
  if (property.part === "part_i") return property.row.gainOrLoss;
  if (property.part === "part_iii") return property.column.line24 - recaptureOf(property.column);
  return 0;
}

/* A Part II row (line 10), or a Part III column's recapture (lines 25b, 26g, 27c, 28b, 29b: line 13). */
function ordinaryOwnAmount(property: PlacedProperty): number {
  if (property.part === "part_ii") return property.row.gainOrLoss;
  if (property.part === "part_iii") return recaptureOf(property.column);
  return 0;
}

const totalOf = (property: PlacedProperty): number =>
  property.part === "part_iii" ? property.column.line24 : property.row.gainOrLoss;

/*
 * The section 1231 amount that ends as ordinary income: line 7 when it is zero
 * or a loss (line 11), else line 12, the gain that line 8's nonrecaptured
 * losses make ordinary (irs-4797-inst-2025::sec::line-8::b01, line-9::b01).
 */
function ordinarySection1231(lines: Form4797Lines): number {
  if (lines.line7 === undefined) return 0;
  return lines.line7 <= 0 ? lines.line7 : (lines.line12 ?? 0);
}

/* The netting member of a Form 6252 gain on line 4: not an activity, so never QBI. */
const FORM_6252_GAIN = "form-6252";

const SHARE_GAP =
  "Section 1231 gains and losses of more than one activity net on line 7, and line 11 or 12 makes part of the net ordinary. A section 1231 amount is QBI only when it is not capital gain or loss (irs-8995-inst-2025::sec::determining-your-qualified-business::b06), and the instructions do not say how the ordinary part splits among the activities.";

/*
 * Each activity's amounts. A section 1231 gain that ends as capital gain (line 9,
 * or line 7 with no line 8) is not QBI (b06), so the ordinary amount takes only
 * the Part II rows, the recapture and line 11 or 12. Line 11 or 12 goes to the
 * one activity whose properties have section 1231 amounts; with two or more the
 * split is not known (SHARE_GAP).
 */
export function form4797Activities(
  properties: LinkedProperty[],
  lines: Form4797Lines,
): Pick<Form4797Activities, "amounts" | "ordinaryGap"> {
  const keys = [...new Set(properties.map((each) => each.activity))];
  const amounts = keys.map((key) => {
    const own = properties.filter((each) => each.activity === key);
    return {
      key,
      ordinary: sum(...own.map(ordinaryOwnAmount)),
      total: sum(...own.map(totalOf)),
    };
  });
  const ordinary1231 = ordinarySection1231(lines);
  if (ordinary1231 === 0) return { amounts };
  const netting = new Set(
    properties.filter((each) => section1231Amount(each) !== 0).map((each) => each.activity),
  );
  // Line 4's Form 6252 gain nets on line 7 too; its sale names no activity (6252/totals.ts).
  if ((lines.line4 ?? 0) !== 0) netting.add(FORM_6252_GAIN);
  if (netting.size !== 1) return { amounts, ordinaryGap: SHARE_GAP };
  return {
    amounts: amounts.map((each) =>
      netting.has(each.key) ? { ...each, ordinary: each.ordinary + ordinary1231 } : each,
    ),
  };
}
