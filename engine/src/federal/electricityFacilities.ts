/*
 * One facility cannot take both electricity production credits: "You can't
 * claim a section 45Y credit for the same qualified facility for which you
 * are claiming a credit under section 45 ... for the tax year or any prior tax
 * year" (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01). A facility
 * whose construction began before 2025 and that was placed in service in 2025
 * fits both Form 8835 (section 45) and Form 7211 (section 45Y), so the facts
 * can state it on both. The engine does not pick one: when a Form 8835
 * facility and a Form 7211 facility have the same address, coordinates or
 * registration number (the test each form uses for a Form 3468 property),
 * the credit of each is a gap.
 */

import {
  getCleanElectricityFacilityFacts,
  getRenewableElectricityFacilityFacts,
  type CleanElectricityFacilityFactValue,
  type RenewableElectricityFacilityFactValue,
} from "../facts/index.js";
import type { ResolverInputs } from "../resolverInputs.js";

export const BOTH_PRODUCTION_CREDITS_GAP =
  "A Form 8835 facility and a Form 7211 facility have the same address, coordinates or registration number, and a facility cannot take the section 45Y credit and the section 45 credit (irs-7211-inst-2025::sec::how-to-claim-the-credit::b01): state only one of them.";

interface FacilityPlace {
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  registrationNumbers: string[];
}

const normalized = (text: string) => text.trim().toLowerCase();

const sameText = (left: string | undefined, right: string | undefined) =>
  left !== undefined && right !== undefined && normalized(left) === normalized(right);

function samePlace(here: FacilityPlace, there: FacilityPlace): boolean {
  const [mine, theirs] = [here.coordinates, there.coordinates];
  const sameCoordinates =
    mine !== undefined &&
    theirs !== undefined &&
    mine.latitude === theirs.latitude &&
    mine.longitude === theirs.longitude;
  const sameRegistration = here.registrationNumbers.some((number) =>
    there.registrationNumbers.some((other) => sameText(number, other)),
  );
  return sameCoordinates || sameRegistration || sameText(here.address, there.address);
}

const renewablePlace = (value: RenewableElectricityFacilityFactValue): FacilityPlace => ({
  address: value.address,
  coordinates: value.coordinates,
  registrationNumbers: value.transfer ? [value.transfer.registrationNumber] : [],
});

const cleanPlace = (value: CleanElectricityFacilityFactValue): FacilityPlace => ({
  address: value.address,
  coordinates: value.coordinates,
  registrationNumbers: [
    value.transfer?.registrationNumber,
    value.electivePayment?.registrationNumber,
  ].filter((number): number is string => number !== undefined),
});

/* A Form 7211 facility that is this Form 8835 facility. */
export function renewableFacilityOnForm7211(
  inputs: ResolverInputs,
  value: RenewableElectricityFacilityFactValue,
): boolean {
  const here = renewablePlace(value);
  return getCleanElectricityFacilityFacts(inputs.facts).some((fact) =>
    samePlace(here, cleanPlace(fact.value)),
  );
}

/* A Form 8835 facility (no section 1603 grant) that is this Form 7211 facility. */
export function cleanFacilityOnForm8835(
  inputs: ResolverInputs,
  value: CleanElectricityFacilityFactValue,
): boolean {
  const here = cleanPlace(value);
  return getRenewableElectricityFacilityFacts(inputs.facts)
    .filter((fact) => fact.value.section1603Grant !== true)
    .some((fact) => samePlace(here, renewablePlace(fact.value)));
}
