/*
 * The whole Form 4136 from the activity facts: each claim checked against its
 * row, then the columns of each row and bracket, line 17 and Part I.
 */

import type {
  FuelEquipment,
  FuelRegistrationLine,
  FuelRegistrationNumbersValue,
  FuelTaxActivityFact,
  FuelTaxClaim,
  FuelTaxLine,
} from "../../facts/kinds/fuelTaxCredit.js";
import { sum } from "../../money.js";
import {
  actualFuelCost,
  amountOfCredit,
  claimCredit,
  claimRate,
  gallonEquivalents,
  line17,
} from "./lines.js";
import { FUEL_ROWS, fuelRowOf, HOME_USE, type DyeBox, type FuelRow } from "./rows.js";

/* Columns (a) and (c) of one row. */
export interface RowColumns {
  /* Column (a) on a row whose column is blank: the claims' type of use. */
  typeOfUse: string | undefined;
  /* The row's claims name more than one type of use: (a) and (c) need a separate statement. */
  typesDiffer: boolean;
  gallons: number;
}

/* Columns (d) and (e) of a row, or of the rows its bracket joins. */
export interface CarrierColumns {
  cost: number;
  credit: number;
}

/* Part I lines B to F (irs-4136-inst-2025::sec::specific-instructions::b01). */
export interface PartI {
  activityCount: number;
  activityKey: string;
  name?: string;
  ein?: string;
  code?: string;
  equipment?: FuelEquipment;
}

export interface Form4136Result {
  rows: ReadonlyMap<FuelTaxLine, RowColumns>;
  carriers: ReadonlyMap<FuelTaxLine, CarrierColumns>;
  line17: number | undefined;
  dyeBoxes: ReadonlySet<DyeBox>;
  registrationNumbers: FuelRegistrationNumbersValue;
  /* A claimed line has no registration number yet: line 17 waits for it. */
  missingRegistration: boolean;
  /* Undefined when the only claim is home use of kerosene ("skip lines B through F"). */
  partI: PartI | undefined;
}

/* Part I lines C to E of the linked Schedule C business or Schedule F farm. */
export type LinkedBusiness = (key: string) => { name?: string; ein?: string; code?: string };

interface PricedClaim {
  claim: FuelTaxClaim;
  row: FuelRow;
  gallons: number;
  credit: number;
}

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

/* Why a claim cannot go on its row; undefined when it can. */
function claimGap(
  claim: FuelTaxClaim,
  row: FuelRow | undefined,
  home: boolean,
): string | undefined {
  if (row === undefined) return `Form 4136 has no line ${String(claim.line)} for a 2025 claim.`;
  if (!isAmount(claim.gallons) || !isAmount(claim.actualFuelCost)) {
    return `A line ${row.line} claim has no gallons or no actual fuel cost.`;
  }
  if (home && (row.line !== "4a" || claim.typeOfUse !== HOME_USE)) {
    return "Home use of kerosene is claimed on line 4a with type of use 8 (irs-4136-inst-2025::sec::line-4::b01).";
  }
  const use = claim.typeOfUse;
  if (row.allowedUses !== undefined && (use === undefined || !row.allowedUses.includes(use))) {
    return `Line ${row.line} takes type of use ${row.allowedUses.join(", ")}; the claim names ${String(use)}.`;
  }
  if (row.allowedUses === undefined && use !== undefined && use !== row.printedUse) {
    return `Line ${row.line} has no type of use ${use}.`;
  }
  const measure = claim.measuredIn;
  if (measure !== undefined && measure !== "gallon_equivalents") {
    if (row.unitsPerEquivalent?.[measure] === undefined) {
      return `Line ${row.line} does not take an amount in ${measure}.`;
    }
  }
  return undefined;
}

/* Column (c) of one claim: the gallons, or the gallon equivalents of lines 11a, 11c and 11g. */
function claimGallons(claim: FuelTaxClaim, row: FuelRow): number {
  const units =
    claim.measuredIn === undefined ? undefined : row.unitsPerEquivalent?.[claim.measuredIn];
  return units === undefined ? claim.gallons : gallonEquivalents(claim.gallons, units);
}

function priceClaims(activities: readonly FuelTaxActivityFact[]): PricedClaim[] | string {
  const priced: PricedClaim[] = [];
  for (const activity of activities) {
    const home = activity.value.kind === "home_kerosene";
    for (const claim of activity.value.claims ?? []) {
      const row = fuelRowOf(claim.line);
      const gap = claimGap(claim, row, home);
      if (gap !== undefined) return gap;
      const gallons = claimGallons(claim, row!);
      const rate = claimRate(row!, claim.typeOfUse, claim.taxedAt244 === true);
      priced.push({ claim, row: row!, gallons, credit: claimCredit(rate, gallons) });
    }
  }
  return priced;
}

function rowColumns(claims: readonly PricedClaim[]): RowColumns {
  const uses = new Set(claims.map((each) => each.claim.typeOfUse));
  const [use] = uses;
  const blank = claims[0].row.allowedUses === undefined;
  return {
    typeOfUse: blank || use === undefined ? undefined : String(use),
    typesDiffer: !blank && uses.size > 1,
    gallons: sum(...claims.map((each) => each.gallons)),
  };
}

function byLine(priced: readonly PricedClaim[], pick: (row: FuelRow) => FuelTaxLine) {
  const lines = new Map<FuelTaxLine, PricedClaim[]>();
  for (const each of priced) {
    const line = pick(each.row);
    lines.set(line, [...(lines.get(line) ?? []), each]);
  }
  return lines;
}

/* The business activity with the most credit, then the most gallons, then the first (DECISION in bindings.ts). */
function partIOf(
  activities: readonly FuelTaxActivityFact[],
  priced: readonly PricedClaim[],
  linked: LinkedBusiness,
): PartI | undefined {
  const businesses = activities.filter(
    (each) => each.value.kind === "business" && (each.value.claims ?? []).length > 0,
  );
  const totals = businesses.map((activity) => {
    const own = priced.filter((each) => activity.value.claims.includes(each.claim));
    return {
      activity,
      credit: sum(...own.map((each) => each.credit)),
      gallons: sum(...own.map((each) => each.gallons)),
    };
  });
  const most = totals.reduce<(typeof totals)[number] | undefined>((best, each) => {
    if (best === undefined) return each;
    if (each.credit !== best.credit) return each.credit > best.credit ? each : best;
    return each.gallons > best.gallons ? each : best;
  }, undefined);
  if (most === undefined) return undefined;
  const { value } = most.activity;
  const business = value.businessKey === undefined ? {} : linked(value.businessKey);
  return {
    activityCount: businesses.length,
    activityKey: most.activity.key,
    name: value.businessName ?? business.name,
    ein: value.ein ?? business.ein,
    code: value.principalBusinessActivityCode ?? business.code,
    equipment: value.equipment,
  };
}

/* Form 4136 from the activity facts, or why a claim cannot be figured. */
export function form4136Of(
  activities: readonly FuelTaxActivityFact[],
  registrationNumbers: FuelRegistrationNumbersValue,
  linked: LinkedBusiness,
): Form4136Result | string {
  const priced = priceClaims(activities);
  if (typeof priced === "string") return priced;
  const rows = new Map<FuelTaxLine, RowColumns>();
  for (const [line, claims] of byLine(priced, (row) => row.line))
    rows.set(line, rowColumns(claims));
  const carriers = new Map<FuelTaxLine, CarrierColumns>();
  for (const [line, claims] of byLine(priced, (row) => row.carrier)) {
    carriers.set(line, {
      cost: actualFuelCost(claims.map((each) => each.claim.actualFuelCost)),
      credit: amountOfCredit(claims.map((each) => each.credit)),
    });
  }
  const claimedRegistrations = new Set<FuelRegistrationLine>();
  for (const each of priced)
    if (each.row.registration) claimedRegistrations.add(each.row.registration);
  const ordered = FUEL_ROWS.map((row) => carriers.get(row.line)).filter(
    (each) => each !== undefined,
  );
  return {
    rows,
    carriers,
    line17: line17(ordered.map((each) => each.credit)),
    dyeBoxes: new Set(
      priced
        .filter((each) => each.claim.visibleDye === true)
        .flatMap((each) => each.row.dyeBox ?? []),
    ),
    registrationNumbers,
    missingRegistration: [...claimedRegistrations].some((line) => !registrationNumbers[line]),
    partI: partIOf(activities, priced, linked),
  };
}
