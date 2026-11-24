/*
 * Form 8582 Parts IV and V for the return's Schedule E properties, from the
 * facts: the rows the K-1 passive limit (passThrough/passive.ts) adds its own
 * rows to. The form builds the same rows from Schedule E line 21
 * (activities.ts); line21Amount is that line's rule, so the two agree.
 */

import { SPOUSE_KEYS } from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { booleanFact } from "../rentals/passive.js";
import { rentalColumnsOf } from "../schedule-e/columns.js";
import { line21Amount } from "../schedule-e/lines.js";
import { activitiesByPart, type PassiveActivity } from "./activities.js";

/*
 * Each part's property rows, undefined while it waits; waitingKeys are the
 * facts to ask again while either part waits (never empty then).
 */
export interface PassiveRentals {
  part4?: PassiveActivity[];
  part5?: PassiveActivity[];
  waitingKeys: string[];
}

export function passiveRentalsOf(inputs: ResolverInputs): PassiveRentals {
  const columns = rentalColumnsOf(inputs);
  const filingStatus = filingStatusOf(inputs);
  const livedApart = booleanFact(inputs.factByKey.get(SPOUSE_KEYS.livedApartAllYear));
  const parts = activitiesByPart(
    {
      rentalProperties: columns.properties,
      rentalPropertiesOverflow: columns.overflow,
      filingStatus,
      livedApartFromSpouseAllYear: livedApart,
    },
    (column) => {
      const property = columns.properties?.find((entry) => entry.column === column);
      return property && line21Amount(property.value);
    },
  );
  if (parts?.part4 && parts.part5) return { ...parts, waitingKeys: [] };
  const livedApartKey =
    filingStatus === "married_filing_separately" && livedApart === undefined
      ? [SPOUSE_KEYS.livedApartAllYear]
      : [];
  return {
    part4: parts?.part4,
    part5: parts?.part5,
    waitingKeys: [...columns.keys, ...livedApartKey],
  };
}
