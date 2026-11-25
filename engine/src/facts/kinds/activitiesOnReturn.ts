/*
 * The businesses and rentals on this return, with the return's depreciation
 * scope added. The mid-quarter test (irs-4562-inst-2025::sec::recovery-period-for-most-property::b02)
 * counts all the personal property the return places in service in 2025, in
 * every activity. When two or more activities place it in service, each
 * activity's depreciation is marked personalPropertyInOtherActivities, and
 * Form 4562 reports the test as a gap (federal/4562/lines.ts).
 */

import { sum } from "../../money.js";
import { statedBusinessesOnReturn, type BusinessFactValue } from "./business.js";
import { placesPersonalProperty, type ScopedDepreciation } from "./depreciation.js";
import { statedRentalsOnReturn, type RentalFactValue } from "./rental.js";
import { section179RecaptureByBusiness } from "./section179Recapture.js";

type FactRow = { key: string; value: unknown; category: string };
type Activity = { key: string; value: BusinessFactValue | RentalFactValue };

function activitiesWithPersonalProperty(facts: ReadonlyArray<FactRow>, joint: boolean): number {
  const activities: Activity[] = [
    ...statedBusinessesOnReturn(facts, joint).businesses,
    ...statedRentalsOnReturn(facts, joint).properties,
  ];
  return activities.filter((activity) => placesPersonalProperty(activity.value.depreciation))
    .length;
}

function marked<T extends Activity>(activities: T[], shared: boolean): T[] {
  if (!shared) return activities;
  return activities.map((activity) =>
    placesPersonalProperty(activity.value.depreciation)
      ? {
          ...activity,
          value: {
            ...activity.value,
            depreciation: {
              ...activity.value.depreciation,
              personalPropertyInOtherActivities: true,
            } satisfies ScopedDepreciation,
          },
        }
      : activity,
  );
}

const SHARED_TEST_MINIMUM = 2;

const BUSINESS_PREFIX = "business.";

/*
 * Form 4797 line 35: the section 179 or 280F(b)(2) recapture goes "as other
 * income on the same form or schedule on which you took the deduction"
 * (irs-4797-inst-2025::sec::line-35::b01): Schedule C line 6 of the business the
 * recapture fact names, added to its stated other income.
 */
function withRecapture<T extends { key: string; value: BusinessFactValue }>(
  businesses: T[],
  facts: ReadonlyArray<FactRow>,
): T[] {
  const recapture = section179RecaptureByBusiness(facts);
  if (recapture.size === 0) return businesses;
  return businesses.map((business) => {
    const amount = recapture.get(business.key.slice(BUSINESS_PREFIX.length));
    if (amount === undefined) return business;
    return {
      ...business,
      value: { ...business.value, otherIncome: sum(business.value.otherIncome, amount) },
    };
  });
}

/* statedBusinessesOnReturn, with the return's depreciation scope and its Form 4797 Part IV recapture. */
export function businessesOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedBusinessesOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  return { ...result, businesses: withRecapture(marked(result.businesses, shared), facts) };
}

/* statedRentalsOnReturn, with the return's depreciation scope. */
export function rentalsOnReturn(facts: ReadonlyArray<FactRow>, joint: boolean) {
  const result = statedRentalsOnReturn(facts, joint);
  const shared = activitiesWithPersonalProperty(facts, joint) >= SHARED_TEST_MINIMUM;
  return { ...result, properties: marked(result.properties, shared) };
}
