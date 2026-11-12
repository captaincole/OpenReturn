/*
 * Form 8582 line 6: modified adjusted gross income, built from AGI's parts
 * (irs-8582-inst-2025::sec::line-6::b01). It leaves out passive activity income
 * and loss (irs-pub-925-2025::sec::rental-activities::b10), so it reads no line
 * that Form 8582's allowed losses feed: not Form 1040 lines 8–11, not Schedule 1
 * line 5. It adds recharacterized nonpassive income (line-6::b02). Also left
 * out: taxable social security (1040 line 6b), the IRA
 * deduction (Schedule 1 line 20), section 501(c)(18) contributions (line 24f),
 * half of self-employment tax (line 15) and student loan interest (line 21).
 * The EE/I bond exclusion (Form 8815) and the FDII/GILTI deduction are not
 * modeled, so nothing is added back for them.
 */

import type { FormAccessor } from "../../defineForm.js";
import { atLeast, numberOrBlank, sum } from "../../money.js";
import { isRentalActivity, selfRentalState } from "../rentals/passive.js";
import type { RentalProperty } from "../schedule-e/filingInfo.js";
import type { Form8582FilingInfo } from "./filingInfo.js";
import type { Form8582 } from "./types.js";

/* Form 1040 income lines with no passive activity amount. */
const FORM_1040_INCOME = ["line.1z", "line.2b", "line.3b", "line.4b", "line.5b", "line.7a"];

/* Schedule 1 Part I, less line 5 (Schedule E) and the totals. */
const SCHEDULE_1_INCOME = [
  "0.line.1",
  "0.line.2a",
  "0.line.3",
  "0.line.4",
  "0.line.6",
  "0.line.7",
  "0.line.9",
];

/* Schedule 1 Part II, less lines 15, 20 and 21; line 24f comes out of line 25 below. */
const SCHEDULE_1_ADJUSTMENTS = [
  "1.line.11",
  "1.line.12",
  "1.line.13",
  "1.line.14",
  "1.line.16",
  "1.line.17",
  "1.line.18",
  "1.line.19a",
  "1.line.23",
  "1.line.25",
];

/* Line 6 reads line 21 of a nonpassive property and of a passive self-rental. */
function readsLine21(property: RentalProperty): boolean {
  if (property.passive === false) return true;
  return property.passive === true && property.value.propertyType === "self_rental";
}

/*
 * The part of a property's line 21 that line 6 counts. A nonpassive rental
 * activity is a real estate professional's (rental-activities::b01), whose loss
 * is left out, so it counts only as income. A royalty or a materially
 * participated short stay (not a rental activity) counts either way. A passive
 * self-rental counts only its net income, recharacterized as nonpassive
 * (line-6::b02); with a prior-year loss the property waits (placementOf).
 */
function line6Amount(property: RentalProperty, net: number): number {
  const { value } = property;
  if (property.passive) {
    return selfRentalState(value, net) === "recharacterized" ? net : 0;
  }
  const professionalRental = value.propertyType !== "royalties" && isRentalActivity(value) === true;
  return professionalRental ? atLeast(0, net) : net;
}

/* Schedule E line 21 as line 6 counts it; undefined while a column it reads is blank. */
function nonpassiveScheduleE(form: FormAccessor<Form8582>, info: Form8582FilingInfo) {
  let total = 0;
  for (const property of info.rentalProperties ?? []) {
    if (!readsLine21(property)) continue;
    const net = numberOrBlank(form[`schedule-e.0.line.21_income_or_loss_${property.column}`]);
    if (net === undefined) return undefined;
    total += line6Amount(property, net);
  }
  return total;
}

/* Line 6, not less than zero; undefined while a part of it is unknown. */
export function modifiedAgi(
  form: FormAccessor<Form8582>,
  info: Form8582FilingInfo,
): number | undefined {
  // The excluded part of employer adoption benefits needs Form 8839, not modeled.
  if ((info.adoptionBenefits ?? 0) > 0) return undefined;
  // As on Schedule 1 line 10: a business whose line 3 waits.
  if (info.hasBusiness === true && form["schedule-1.0.line.3"] === undefined) return undefined;
  const scheduleE = nonpassiveScheduleE(form, info);
  if (scheduleE === undefined) return undefined;
  const income = sum(
    ...FORM_1040_INCOME.map((line) => form[`form-1040.${line}`]),
    ...SCHEDULE_1_INCOME.map((line) => form[`schedule-1.${line}`]),
    scheduleE,
  );
  const adjustments =
    sum(...SCHEDULE_1_ADJUSTMENTS.map((line) => form[`schedule-1.${line}`])) -
    sum(form["schedule-1.1.line.24f"]);
  return atLeast(0, income - adjustments);
}
