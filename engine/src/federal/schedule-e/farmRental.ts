/*
 * Schedule E lines 40 and 42 from Form 4835 (federal/4835/resolveInfo.ts), and
 * the farm rental's part of lines 41 and 43. Hand-written (MANUAL EDIT): the
 * bindings spread farmRentalBindings.
 */

import type { FormAccessor } from "../../defineForm.js";
import { roundDollars, sumOrBlank } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { isGap } from "../4835/lines.js";
import type { PassThroughEntity } from "../passThrough/items.js";
import type { ScheduleEFilingInfo } from "./filingInfo.js";
import type { ScheduleE } from "./types.js";

type Form = FormAccessor<ScheduleE>;
type Info = ScheduleEFilingInfo;

const K1_FARMING_AMOUNT_MISSING =
  "Line 42: a Schedule K-1 gross farming or fishing income item has no amount.";

/*
 * Line 40: Form 4835 line 32, or line 34c for a loss
 * (irs-4835-inst-2025::sec::face-part-ii::b02: "enter it here and on Schedule E
 * (Form 1040), line 40"). Blank with no farm rental; undefined while it waits.
 */
export function line40(info: Info): number | Unsupported | undefined {
  const net = info.farmRentalNet;
  if (isGap(net)) return unsupported(net.gap);
  return net;
}

/* The K-1 items of gross farming or fishing income; undefined when one has no amount. */
function k1FarmingIncome(entities: ReadonlyArray<PassThroughEntity>): number[] | undefined {
  const items = entities.flatMap((entity) =>
    entity.items.filter((item) => item.type === "gross_farming_fishing_income"),
  );
  if (items.some((item) => item.amount === undefined)) return undefined;
  return items.map((item) => item.amount ?? 0);
}

/*
 * Line 42, the label: "gross farming and fishing income reported on Form 4835,
 * line 7; Schedule K-1 (Form 1065), box 14, code B; Schedule K-1 (Form 1120-S),
 * box 17, code AN; and Schedule K-1 (Form 1041), box 14, code F". The estimated
 * tax rules for farmers read it (irs-1040se-inst-2025::sec::part-v-summary::b01).
 * Blank with none of them.
 */
export function line42(info: Info): number | Unsupported | undefined {
  const gross = info.farmRentalGross;
  if (isGap(gross)) return unsupported(gross.gap);
  const k1 = k1FarmingIncome(info.passThroughEntities ?? []);
  if (k1 === undefined) return unsupported(K1_FARMING_AMOUNT_MISSING);
  // A farm rental whose line 7 waits keeps line 42 waiting.
  if (info.farmRentalInUse && gross === undefined && info.farmRentalNet === undefined) {
    return undefined;
  }
  const total = sumOrBlank(gross, ...k1);
  return total === undefined ? undefined : roundDollars(total);
}

/*
 * Line 41's farm rental part: the gap of line 40; "waits" while a farm rental's
 * line 40 waits; else line 40's amount (undefined with no farm rental).
 */
export function line40ForLine41(
  form: Form,
  info: Info,
): number | Unsupported | "waits" | undefined {
  if (!info.farmRentalInUse) return undefined;
  const net = info.farmRentalNet;
  if (isGap(net)) return unsupported(net.gap);
  const amount = form["1.line.40_net_farm_rental_income"];
  return typeof amount === "number" ? amount : "waits";
}

/*
 * Line 43's farm rental part: a real estate professional's net income or loss from
 * the farm rental they materially participated in (irs-4835-inst-2025::sec::line-34::b01,
 * "include the loss in the total for Schedule E (Form 1040), line 43"). Undefined
 * with no such farm rental; "waits" while line 40 or the answer waits.
 */
export function farmRentalForLine43(form: Form, info: Info): number | "waits" | undefined {
  if (info.realEstateProfessional !== true || !info.farmRentalInUse) return undefined;
  if (info.farmRentalNonpassive === false) return undefined;
  const amount = form["1.line.40_net_farm_rental_income"];
  if (info.farmRentalNonpassive === undefined || typeof amount !== "number") return "waits";
  return amount;
}

export function farmRentalBindings() {
  return {
    "1.line.40_net_farm_rental_income": (_: Form, info: Info) => line40(info),
    "1.line.42_farming_fishing_reconciliation": (_: Form, info: Info) => line42(info),
  };
}
