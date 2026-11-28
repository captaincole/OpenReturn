/*
 * The copies of Form 7207 a return files: one for each facility fact, "a
 * separate Form 7207 for each facility operated to produce and sell eligible
 * components" (irs-7207-inst-2025::sec::general-instructions::b01), then one
 * separate form for the credits from pass-through entities, line 7
 * (line-7::b01). The separate form is not needed when a K-1 is the only
 * source of the credit (line-7::b01), so it files next to a facility's form,
 * or alone when the decision says the form files. Everything here is figured
 * from the facts, so Form 3800 can read every copy.
 */

import {
  getInvestmentCreditPropertyFacts,
  readAdvancedManufacturingFacilityFacts,
  type AdvancedManufacturingFacilityFact,
  type InvestmentCreditFacility,
} from "../../facts/index.js";
import type { ResolverInputs } from "../../resolverInputs.js";
import { unsupported, type Unsupported } from "../../types.js";
import { filedForm3468Copies } from "../3468/resolveInfo.js";
import { LINE_7_FIELD, LINE_8A_FIELD } from "./components.js";
import { line8a } from "./lines.js";
import { facilityPartI, passThroughPartI, type Cells } from "./partI.js";
import { passThroughCreditOf } from "./passThroughCredit.js";
import { facilityRows } from "./rows.js";

export const PASS_THROUGH_COPY = "pass-through";

export interface Form7207Copy {
  /* The facility fact, or "pass-through" for the separate form. */
  key: string;
  cells: Cells;
  /* Line 8a; on the separate form, line 7 alone. */
  total: number | Unsupported | undefined;
}

const SAME_FACILITY_GAP = (key: string) =>
  `Form 3468 Part III claims the section 48C credit for property at this facility (${key}), and line 6 says No. A component produced with that property cannot earn this credit (irs-7207-inst-2025::sec::line-6::b01): answer line 6 Yes and state only the components produced without it.`;
const UNKNOWN_LOCATION_GAP = (key: string) =>
  `Form 3468 Part III claims the section 48C credit for a property (${key}), and line 6 says No, but the facts do not give both locations, so the engine cannot tell whether that property is part of this facility (irs-7207-inst-2025::sec::line-6::b01). State the address of the facility and of the property.`;

/* An address compared word for word, case and spacing aside. */
const addressWords = (address: string): string =>
  address.toLowerCase().split(" ").filter(Boolean).join(" ");

/* Undefined when the two places cannot be compared; else whether they are the same place. */
function sameLocation(
  facility: AdvancedManufacturingFacilityFact["value"],
  property: InvestmentCreditFacility,
): boolean | undefined {
  if (facility.address !== undefined && property.address !== undefined) {
    return addressWords(facility.address) === addressWords(property.address);
  }
  const here = facility.coordinates;
  const there = property.coordinates;
  if (here !== undefined && there !== undefined) {
    return here.latitude === there.latitude && here.longitude === there.longitude;
  }
  return undefined;
}

/*
 * "You can't claim the advanced manufacturing production credit for eligible
 * components produced using any property that is part of a facility for which
 * a credit under section 48C was previously taken" (irs-7207-inst-2025::sec::line-6::b01).
 * A facility that answers line 6 No while a Form 3468 Part III property of the
 * return is there, or may be there, is a gap: both credits are never claimed.
 */
export function section48cConflict(
  inputs: ResolverInputs,
  facility: AdvancedManufacturingFacilityFact["value"],
): string | undefined {
  if (facility.section48cProperty) return undefined;
  const filed = new Set(filedForm3468Copies(inputs).map((copy) => copy.key));
  const advancedEnergy = getInvestmentCreditPropertyFacts(inputs.facts).filter(
    (fact) => fact.value.credit.part === "advanced_energy" && filed.has(fact.key),
  );
  for (const property of advancedEnergy) {
    const same = sameLocation(facility, property.value.facility);
    if (same === true) return SAME_FACILITY_GAP(property.key);
    if (same === undefined) return UNKNOWN_LOCATION_GAP(property.key);
  }
  return undefined;
}

const firstGap = (values: ReadonlyArray<number | Unsupported>): Unsupported | undefined =>
  values.find((value): value is Unsupported => typeof value !== "number");

/* One facility's Form 7207. Line 7 stays blank: the separate form carries it (line-7::b01). */
export function facilityCopy(
  inputs: ResolverInputs,
  fact: AdvancedManufacturingFacilityFact,
): Form7207Copy {
  const { cells, columnE } = facilityRows(fact.value);
  const conflict = section48cConflict(inputs, fact.value);
  const gap = conflict === undefined ? firstGap(columnE) : unsupported(conflict);
  const numbers = columnE.filter((value): value is number => typeof value === "number");
  const total = gap ?? (columnE.length === 0 ? undefined : line8a(numbers, undefined));
  return {
    key: fact.key,
    cells: { ...facilityPartI(fact.value), ...cells, [LINE_8A_FIELD]: total },
    total,
  };
}

/* The separate form: line 7, and line 8a, which adds only line 7 on it. */
export function passThroughCopy(inputs: ResolverInputs): Form7207Copy | undefined {
  const line7 = passThroughCreditOf(inputs);
  if (line7 === undefined) return undefined;
  return {
    key: PASS_THROUGH_COPY,
    cells: { ...passThroughPartI(), [LINE_7_FIELD]: line7, [LINE_8A_FIELD]: line7 },
    total: line7,
  };
}

/* Every copy, the facilities in the order recorded and the separate form last. */
export function form7207Copies(inputs: ResolverInputs): Form7207Copy[] {
  const { facilities } = readAdvancedManufacturingFacilityFacts(inputs.facts);
  const copies = facilities.map((fact) => facilityCopy(inputs, fact));
  const separate = passThroughCopy(inputs);
  return separate === undefined ? copies : [...copies, separate];
}
