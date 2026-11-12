/*
 * Form 8582 Parts IV and V: which Schedule E properties are passive activities,
 * the part each one goes in, and its amounts. Parts VI–VIII and Schedule E
 * line 22 read the same list (allocation.ts).
 *
 * irs-8582-inst-2025::sec::specific-instructions::b01: Part IV holds rental real
 * estate activities with active participation; Part V holds all other passive
 * activities (irs-8582-inst-2025::sec::part-v::b01). A Schedule E property
 * reports on one form only, so Part IX (losses on two forms) never applies.
 */

import type { RentalFactValue } from "../../facts/index.js";
import { numberOrBlank, roundDollars, sum } from "../../money.js";
import { isRentalActivity, isSelfRentalNetIncome } from "../rentals/passive.js";
import type { PropertyColumn, RentalProperty } from "../schedule-e/filingInfo.js";
import type { Form8582FilingInfo } from "./filingInfo.js";

/* Each part prints five rows; more need an attached statement (not modeled). */
export const ROWS_PER_PART = 5;

export type ActivityPart = "part4" | "part5";

export interface PassiveActivity {
  factKey: string;
  column: PropertyColumn;
  part: ActivityPart;
  name: string;
  /* Column (a): current year net income; 0 when none. */
  netIncome: number;
  /* Column (b): current year net loss, as a positive amount; 0 when none. */
  netLoss: number;
  /* Column (c): prior years' unallowed loss, as a positive amount; 0 when none. */
  priorUnallowedLoss: number;
}

/* Each part's rows in Schedule E column order. */
export type PassiveActivities = Record<ActivityPart, PassiveActivity[]>;

/*
 * The same, with a part undefined while a property that could add a row to it
 * is undecided or its amounts wait: the part's row order and totals (Part I
 * lines 1 or 2) depend on it. The other part's rows still print.
 */
export type ActivitiesByPart = Partial<PassiveActivities>;

/* What the parts read: Schedule E's properties and the MFS caution's answers. */
export type ActivitiesInfo = Pick<
  Form8582FilingInfo,
  "rentalProperties" | "rentalPropertiesOverflow" | "filingStatus" | "livedApartFromSpouseAllYear"
>;

/* Schedule E line 21 for a column: signed whole dollars; not a number while blocked. */
export type Line21Reader = (column: PropertyColumn) => unknown;

/* Where the current year amounts (columns (a)–(b)) and the prior-year loss (column (c)) go. */
export interface Placement {
  current: ActivityPart;
  prior: ActivityPart;
}

/* Why a property's place is undecided: its passive answer, another property answer, or living apart. */
export type Undecided = "passive" | "property" | "lived_apart";

const whole = (part: ActivityPart): Placement => ({ current: part, prior: part });

/* Facts the engine does not model leave the property's place open. */
function unmodeled(value: RentalFactValue, net: number | undefined): boolean {
  // An entire disposition needs its Form 4797 or 8949 gain, which no fact links to the property.
  if (value.disposedOfEntirely) return true;
  // Type 8 can be real estate (Part IV) or personal property (Part V).
  if (value.propertyType === "other") return true;
  const income = net === undefined || net > 0;
  // A passive trade or business may be a significant participation activity, whose income is recharacterized.
  if (value.propertyType !== "royalties" && isRentalActivity(value) === false) return income;
  // Land's net income is nonpassive under 30% depreciable basis (rental-of-nondepreciable-property::b01): no fact holds it.
  return value.propertyType === "land" && income;
}

/*
 * A self-rental's net income is off Form 8582 (irs-pub-925-2025::sec::disclosure-requirement::b05);
 * a net loss is placed as any passive rental (undefined here). Income over a prior-year
 * loss allows that loss outside the form, which no line models: it waits, as does an unknown net.
 */
function selfRentalPlacement(
  value: RentalFactValue,
  net: number | undefined,
): "property" | null | undefined {
  const netIncome = isSelfRentalNetIncome(value, net);
  if (netIncome === undefined) return "property";
  if (!netIncome) return undefined;
  return (value.priorYearUnallowedLoss ?? 0) > 0 ? "property" : null;
}

/* A passive rental real estate activity: Part IV with active participation (part-iv-2::b01). */
function realEstatePlacement(value: RentalFactValue, info: ActivitiesInfo): Placement | Undecided {
  if (value.activeParticipation === undefined) return "property";
  if (!value.activeParticipation) return whole("part5");
  // part-iv-2::b01: MFS spouses who lived together at any time use Part V.
  if (info.filingStatus === "married_filing_separately") {
    if (info.livedApartFromSpouseAllYear === undefined) return "lived_apart";
    if (!info.livedApartFromSpouseAllYear) return whole("part5");
  }
  if ((value.priorYearUnallowedLoss ?? 0) === 0) return whole("part4");
  // part-iv-2::b01: column (c) stays in Part IV only with active participation in the year the loss arose too.
  if (value.activeParticipationWhenLossArose === undefined) return "property";
  return { current: "part4", prior: value.activeParticipationWhenLossArose ? "part4" : "part5" };
}

/*
 * The parts of one property: null when it is not on Form 8582. net is Schedule E
 * line 21 (undefined while blank); its sign, or a self-rental's net with its prior-year loss.
 */
export function placementOf(
  property: Pick<RentalProperty, "value" | "passive">,
  info: ActivitiesInfo,
  net: number | undefined,
): Placement | Undecided | null {
  const value = property.value;
  if (property.passive === undefined) return "passive";
  // A former passive activity's prior-year loss (former-passive-activities::b01) is not modeled.
  if (!property.passive) return (value.priorYearUnallowedLoss ?? 0) > 0 ? "property" : null;
  if (unmodeled(value, net)) return "property";
  const selfRental = selfRentalPlacement(value, net);
  if (selfRental !== undefined) return selfRental;
  if (value.propertyType === "royalties") return whole("part5");
  // Not a rental activity: a passive trade or business goes in Part V (reporting-income-and-losses-from-the::b01).
  if (isRentalActivity(value) === false) return whole("part5");
  return realEstatePlacement(value, info);
}

/* Schedule E line 1a's address; a royalty may have none. */
function activityName(property: RentalProperty): string {
  const place = property.value.address;
  if (place) return `${place.street}, ${place.city}, ${place.state} ${place.zip}`;
  const kind = property.value.propertyType === "royalties" ? "Royalties" : "Rental";
  return `${kind}, Schedule E property ${property.column.toUpperCase()}`;
}

/* One row, or two when the prior-year loss goes in Part V (part-iv-2::b01). */
function rowsOf(property: RentalProperty, placement: Placement, net: number): PassiveActivity[] {
  const base = { factKey: property.factKey, column: property.column, name: activityName(property) };
  const prior = roundDollars(property.value.priorYearUnallowedLoss ?? 0);
  const current = {
    ...base,
    part: placement.current,
    netIncome: net > 0 ? net : 0,
    netLoss: net < 0 ? -net : 0,
  };
  if (placement.prior === placement.current) return [{ ...current, priorUnallowedLoss: prior }];
  return [
    { ...current, priorUnallowedLoss: 0 },
    { ...base, part: placement.prior, netIncome: 0, netLoss: 0, priorUnallowedLoss: prior },
  ];
}

/* The parts an undecided property could add a row to: a royalty or a short stay only Part V. */
function possibleParts(property: RentalProperty, placement: Placement | Undecided): ActivityPart[] {
  if (typeof placement !== "string") return [placement.current, placement.prior];
  const value = property.value;
  if (value.propertyType === "royalties" || isRentalActivity(value) === false) return ["part5"];
  return ["part4", "part5"];
}

/* Parts IV and V, each undefined while it waits; undefined while a property is past Schedule E's columns. */
export function activitiesByPart(
  info: ActivitiesInfo,
  line21: Line21Reader,
): ActivitiesByPart | undefined {
  // A property past Schedule E's three columns is on no column the engine reads.
  if (info.rentalPropertiesOverflow) return undefined;
  const rows: PassiveActivities = { part4: [], part5: [] };
  const waiting = new Set<ActivityPart>();
  for (const property of info.rentalProperties ?? []) {
    const net = numberOrBlank(line21(property.column));
    const placement = placementOf(property, info, net);
    if (placement === null) continue;
    if (typeof placement === "string" || net === undefined) {
      for (const part of possibleParts(property, placement)) waiting.add(part);
      continue;
    }
    for (const row of rowsOf(property, placement, net)) rows[row.part].push(row);
  }
  const settled = (part: ActivityPart) =>
    waiting.has(part) || rows[part].length > ROWS_PER_PART ? undefined : rows[part];
  return { part4: settled("part4"), part5: settled("part5") };
}

/* Both parts, or undefined while either waits: Parts VI–VIII and Schedule E line 22 need every row. */
export function passiveActivities(
  info: ActivitiesInfo,
  line21: Line21Reader,
): PassiveActivities | undefined {
  const parts = activitiesByPart(info, line21);
  return parts?.part4 && parts.part5 ? { part4: parts.part4, part5: parts.part5 } : undefined;
}

/*
 * One Schedule E column's loss on the form: columns (b) and (c) of its Part IV
 * and Part V rows (a prior-year loss can sit in Part V). Undefined when the
 * column has no row: it is not a passive activity on Form 8582.
 */
export function activityLoss(
  activities: PassiveActivities,
  column: PropertyColumn,
): number | undefined {
  const own = [...activities.part4, ...activities.part5].filter((row) => row.column === column);
  return own.length === 0
    ? undefined
    : sum(...own.map((row) => row.netLoss + row.priorUnallowedLoss));
}

/* Columns (d) and (e): (a) less (b) and (c). Positive is an overall gain. */
export function overallOf(activity: PassiveActivity): number {
  return activity.netIncome - activity.netLoss - activity.priorUnallowedLoss;
}
