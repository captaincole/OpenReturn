/*
 * Schedule E Part I's columns from the facts: the first three rental or royalty
 * properties on this return, each with its passive answer. Schedule E's
 * resolver and the K-1 passive limit (passThrough/receipts.ts) read the same
 * list, so Form 8582's rows are the same in both.
 */

import { RENTAL_KEYS, rentalsOnReturn } from "../../facts/index.js";
import { filingStatusOf, type ResolverInputs } from "../../resolverInputs.js";
import { booleanFact, isPassiveActivity, spousePropertiesOnReturn } from "../rentals/passive.js";
import type { PropertyColumn, RentalProperty } from "./filingInfo.js";

export const PROPERTY_COLUMNS: PropertyColumn[] = ["a", "b", "c"];

export interface RentalColumns {
  /* Columns A to C, in fact order; undefined with no property. */
  properties?: RentalProperty[];
  /* More properties than the three columns. */
  overflow: boolean;
  /* Every property fact on this return, the ones past the columns included. */
  keys: string[];
}

export function rentalColumnsOf(inputs: ResolverInputs): RentalColumns {
  const { properties } = rentalsOnReturn(
    inputs.facts,
    spousePropertiesOnReturn(filingStatusOf(inputs)),
  );
  const professional = booleanFact(inputs.factByKey.get(RENTAL_KEYS.realEstateProfessional));
  return {
    properties:
      properties.length > 0
        ? properties.slice(0, PROPERTY_COLUMNS.length).map((property, index) => ({
            factKey: property.key,
            column: PROPERTY_COLUMNS[index],
            value: property.value,
            passive: isPassiveActivity(property.value, professional),
          }))
        : undefined,
    overflow: properties.length > PROPERTY_COLUMNS.length,
    keys: properties.map((property) => property.key),
  };
}
