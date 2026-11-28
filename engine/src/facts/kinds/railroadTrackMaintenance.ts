/*
 * Form 8900: the railroad track maintenance credit of a Schedule C business
 * (a short line railroad run as a sole proprietorship, or a shipper or a
 * supplier of a short line railroad). One fact per return: "all members of a
 * 'controlled group of corporations' and all members of a 'group of
 * businesses under common control' are treated as a single taxpayer"
 * (irs-8900-inst-2025::sec::member-of-controlled-group-or::b01), and Form
 * 8900 has one line 1. The taxpayer states every amount from the business's
 * books and the assignment statements; no information return holds them.
 *
 * A credit passed through on a Schedule K-1 is not this fact: the K-1 holds
 * it (box 15 or box 13, code AJ), and Form 8900 line 6 shows it. A taxpayer
 * whose only credit is from a K-1 files no Form 8900
 * (irs-8900-inst-2025::sec::general-instructions::b01).
 *
 * The credit lowers the basis of the asset that holds the capitalized
 * expenditures (irs-8900-inst-2025::sec::adjustments-to-basis::b01):
 * activitiesOnReturn.ts takes it off the asset's cost.
 */

type FactRow = { key: string; value: unknown; category: string };

/*
 * The part of line 1 the business capitalizes, and where: "Some or all of the
 * QRTME paid or incurred by an eligible taxpayer may be required to be
 * capitalized as a tangible asset or an intangible asset"
 * (irs-8900-inst-2025::sec::adjustments-to-basis::b01). Exactly one of
 * `asset`, `amortizedCost` and `notPlacedInService` says where it is.
 */
export interface CapitalizedTrackExpenditure {
  /* The amount of line 1 capitalized in this asset. */
  amount: number;
  /* The description of the asset placed in service in 2025 in the business's depreciation (Form 4562). */
  asset?: string;
  /* The description of the business's amortized cost (an intangible asset) that holds it. */
  amortizedCost?: string;
  /* The structure is not placed in service in 2025, so it has no 2025 depreciation. */
  notPlacedInService?: boolean;
}

export interface RailroadTrackMaintenanceFactValue {
  /* The Schedule C business (`business.<id>`) that pays the expenditures. */
  businessKey: string;
  /* The business is a Class II or Class III railroad: lines 3a and 3b apply only to one (line-3a::b01, line-3b::b01). */
  classIIOrIIIRailroad: boolean;
  /*
   * Line 1: the qualified railroad track maintenance expenditures paid or
   * incurred in 2025, with a payment to a railroad for an assignment of miles
   * (irs-8900-inst-2025::sec::specific-instructions::b01), and not reduced by
   * a reimbursement from the assignor (general-instructions::b04).
   */
  expenditures: number;
  /*
   * Line 3a: miles of eligible railroad track the railroad owns or leases at
   * the close of its tax year; "1 mile of double track is 2 miles"
   * (general-instructions::b03).
   */
  milesOwnedOrLeased?: number;
  /* Line 3b: miles of line 3a the railroad assigned to other eligible taxpayers. */
  milesAssignedToOthers?: number;
  /* Line 3c: miles assigned to the business by the owner or lessee. */
  milesAssignedToYou?: number;
  /*
   * Line 5 for a member of a controlled group or a group under common control:
   * "your credit is determined on a proportionate basis to your share of the
   * aggregate QRTME taken into account by the group ... Enter your share of
   * the credit on line 5" (member-of-controlled-group-or::b01). Absent for a
   * business that is not a member.
   */
  groupShareOfCredit?: number;
  /* The parts of line 1 capitalized; absent or empty when the business deducts all of it. */
  capitalized?: CapitalizedTrackExpenditure[];
}

export interface RailroadTrackMaintenanceFact {
  key: string;
  value: RailroadTrackMaintenanceFactValue;
}

const TRACK_CATEGORY = "self_employment";
export const RAILROAD_TRACK_MAINTENANCE_KEY = "railroad_track_maintenance";

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isOptionalAmount = (value: unknown): boolean => value === undefined || isAmount(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isText = (value: unknown): boolean => typeof value === "string" && value.trim() !== "";

/* One place for a capitalized amount: an asset, an amortized cost, or not yet in service. */
function isCapitalized(value: unknown): boolean {
  if (!isRecord(value) || !isAmount(value.amount)) return false;
  const places = [
    isText(value.asset),
    isText(value.amortizedCost),
    value.notPlacedInService === true,
  ].filter(Boolean);
  const unknownPlace =
    (value.asset !== undefined && !isText(value.asset)) ||
    (value.amortizedCost !== undefined && !isText(value.amortizedCost)) ||
    (value.notPlacedInService !== undefined && value.notPlacedInService !== true);
  return places.length === 1 && !unknownPlace;
}

function isTrackMaintenance(value: unknown): value is RailroadTrackMaintenanceFactValue {
  if (!isRecord(value)) return false;
  const capitalized = value.capitalized;
  return (
    isText(value.businessKey) &&
    typeof value.classIIOrIIIRailroad === "boolean" &&
    isAmount(value.expenditures) &&
    isOptionalAmount(value.milesOwnedOrLeased) &&
    isOptionalAmount(value.milesAssignedToOthers) &&
    isOptionalAmount(value.milesAssignedToYou) &&
    isOptionalAmount(value.groupShareOfCredit) &&
    (capitalized === undefined || (Array.isArray(capitalized) && capitalized.every(isCapitalized)))
  );
}

/* The return's railroad track maintenance fact; malformed when its shape is wrong (Cade records it again). */
export function readRailroadTrackMaintenanceFact(facts: ReadonlyArray<FactRow>): {
  fact?: RailroadTrackMaintenanceFact;
  malformed: boolean;
} {
  const row = facts.find(
    (each) => each.category === TRACK_CATEGORY && each.key === RAILROAD_TRACK_MAINTENANCE_KEY,
  );
  if (row === undefined) return { malformed: false };
  if (!isTrackMaintenance(row.value)) return { malformed: true };
  return { fact: { key: row.key, value: row.value }, malformed: false };
}
