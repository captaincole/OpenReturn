/*
 * Form 8582 Parts VI–VIII: the special allowance (Part VI) and the unallowed
 * loss (Part VII) shared among the activities with an overall loss, and each
 * activity's allowed loss (Part VIII). Schedule E line 22 reads
 * allowedLossForColumn, which needs no Form 8582 field past line 9.
 *
 * irs-8582-inst-2025::sec::parts-iv-and-v::b01: activities with an overall loss
 * in column (e) share line 11 through Parts VI, VII and VIII. Part VI only with
 * an amount (other than zero) on line 9.
 */

import { numberOrBlank, roundDollars, sum } from "../../money.js";
import type { PropertyColumn } from "../schedule-e/filingInfo.js";
import {
  activityLoss,
  overallOf,
  passiveActivities,
  ROWS_PER_PART,
  type ActivitiesInfo,
  type PassiveActivities,
  type PassiveActivity,
} from "./activities.js";

/* A field read by full id: Form 8582's lines and Schedule E's line 21. */
export type FieldReader = (fieldId: string) => unknown;

/* Ratios carry five decimal places, as the answer key prints them (1.00000). */
const RATIO_DIGITS = 5;
const RATIO_SCALE = 100000;

/* One activity of Part VII or VIII: Schedule E column and name. */
interface ActivityRef {
  factKey: string;
  column: PropertyColumn;
  name: string;
}

export interface Part6Row extends ActivityRef {
  loss: number;
  ratio: string;
  allowance: number;
  /* Column (d); undefined when column (c)'s total equals column (a)'s (part-vi::b03). */
  remaining?: number;
}

export interface Part7Row extends ActivityRef {
  loss: number;
  ratio: string;
  unallowed: number;
}

export interface Part8Row extends ActivityRef {
  loss: number;
  unallowed: number;
  allowed: number;
}

export interface LossAllocation {
  /* Undefined when Part VI is skipped (line 9 blank or zero). */
  part6?: Part6Row[];
  part7: Part7Row[];
  part8: Part8Row[];
}

const NONE: LossAllocation = { part7: [], part8: [] };

const refOf = ({ factKey, column, name }: ActivityRef): ActivityRef => ({ factKey, column, name });

const overallLoss = (activity: PassiveActivity) => -overallOf(activity);

/* Each loss's share of the total, scaled; the last takes the remainder so the ratios total 1.00. */
function scaledRatios(losses: number[]): number[] {
  const total = sum(...losses);
  const ratios = losses.map((loss) => roundDollars((loss * RATIO_SCALE) / total));
  ratios[ratios.length - 1] = RATIO_SCALE - sum(...ratios.slice(0, -1));
  return ratios;
}

/* Each ratio times the amount; the last takes the remainder so the column totals the amount. */
function sharesOf(ratios: number[], amount: number): number[] {
  const shares = ratios.map((ratio) => roundDollars((ratio * amount) / RATIO_SCALE));
  shares[shares.length - 1] = amount - sum(...shares.slice(0, -1));
  return shares;
}

/* A scaled ratio as text: 100000 prints "1.00000". */
function ratioText(scaled: number): string {
  const digits = String(scaled).padStart(RATIO_DIGITS + 1, "0");
  return `${digits.slice(0, -RATIO_DIGITS)}.${digits.slice(-RATIO_DIGITS)}`;
}

/* part-vi::b02–b04: line 9 shared among Part IV's overall losses. */
function part6Rows(part4: PassiveActivity[], line9: number): Part6Row[] {
  const losing = part4.filter((activity) => overallLoss(activity) > 0);
  if (losing.length === 0) return [];
  const losses = losing.map(overallLoss);
  const ratios = scaledRatios(losses);
  const allowances = sharesOf(ratios, line9);
  const withD = sum(...allowances) < sum(...losses);
  return losing.map((activity, index) => ({
    ...refOf(activity),
    loss: losses[index],
    ratio: ratioText(ratios[index]),
    allowance: allowances[index],
    remaining: withD ? losses[index] - allowances[index] : undefined,
  }));
}

/*
 * part-vii-allocation-of-unallowed-losses::b01: Part VI column (d), or Part IV
 * column (e) without Part VI, then Part V column (e). One row per activity: a
 * rental whose prior-year loss is in Part V adds both (part-viii-allowed-losses::b01).
 */
function part7Losses(
  { part4, part5 }: PassiveActivities,
  part6: Part6Row[] | undefined,
): Array<ActivityRef & { loss: number }> {
  const fromPart4 = part6
    ? part6.map((row) => ({ ...refOf(row), loss: row.remaining ?? 0 }))
    : part4.map((activity) => ({ ...refOf(activity), loss: overallLoss(activity) }));
  const fromPart5 = part5.map((activity) => ({ ...refOf(activity), loss: overallLoss(activity) }));
  const merged = new Map<string, ActivityRef & { loss: number }>();
  for (const entry of [...fromPart4, ...fromPart5].filter((candidate) => candidate.loss > 0)) {
    const seen = merged.get(entry.factKey);
    merged.set(entry.factKey, seen ? { ...seen, loss: seen.loss + entry.loss } : entry);
  }
  return [...merged.values()];
}

/* part-vii-allocation-of-unallowed-losses::b02: line C (line 3 less line 9) shared by ratio. */
function part7Rows(losses: Array<ActivityRef & { loss: number }>, lineC: number): Part7Row[] {
  if (losses.length === 0) return [];
  const ratios = scaledRatios(losses.map((entry) => entry.loss));
  const unallowed = sharesOf(ratios, lineC);
  return losses.map((entry, index) => ({
    ...entry,
    ratio: ratioText(ratios[index]),
    unallowed: unallowed[index],
  }));
}

/* part-viii-allowed-losses::b01–b02: columns (b) and (c) of Parts IV and V, less Part VII column (c). */
function part8Rows(part7: Part7Row[], { part4, part5 }: PassiveActivities): Part8Row[] {
  const rows = [...part4, ...part5];
  return part7.map((entry) => {
    const own = rows.filter((activity) => activity.factKey === entry.factKey);
    const loss = sum(...own.map((activity) => activity.netLoss + activity.priorUnallowedLoss));
    return { ...refOf(entry), loss, unallowed: entry.unallowed, allowed: loss - entry.unallowed };
  });
}

/*
 * Line 9, or 0 when Part II is skipped: line 1d (Part IV's rows) is not a loss.
 * Part IV holds no row for MFS spouses who lived together. Undefined while it waits.
 */
function specialAllowance(part4: PassiveActivity[], line9: unknown): number | undefined {
  if (sum(...part4.map(overallOf)) >= 0) return 0;
  return numberOrBlank(line9);
}

/* Parts VI–VIII from the parts and lines 3 and 9; undefined while they wait. */
export function allocateLosses(
  activities: PassiveActivities | undefined,
  line3: unknown,
  line9: unknown,
): LossAllocation | undefined {
  if (!activities) return undefined;
  if (activities.part4.length + activities.part5.length === 0) return NONE;
  const combined = numberOrBlank(line3);
  if (combined === undefined) return undefined;
  // how-to-report-allowed-losses::b01: line 3 income or zero allows every loss in full.
  if (combined >= 0) return NONE;
  const allowance = specialAllowance(activities.part4, line9);
  if (allowance === undefined) return undefined;
  const part6 = allowance > 0 ? part6Rows(activities.part4, allowance) : undefined;
  // Line C of Part VII; zero when line 11 equals every loss, allowed in full (how-to-report-allowed-losses::b01).
  const lineC = -combined - allowance;
  if (lineC <= 0) return { part6, part7: [], part8: [] };
  const part7 = part7Rows(part7Losses(activities, part6), lineC);
  if (part7.length > ROWS_PER_PART) return undefined;
  return { part6, part7, part8: part8Rows(part7, activities) };
}

/* Parts VI–VIII as the form's own fields compute them. */
export function lossAllocation(
  read: FieldReader,
  info: ActivitiesInfo,
): LossAllocation | undefined {
  const activities = passiveActivities(info, (column) =>
    read(`schedule-e.0.line.21_income_or_loss_${column}`),
  );
  return allocateLosses(
    activities,
    read("form-8582.0.line.3_combined"),
    read("form-8582.0.line.9_special_allowance"),
  );
}

/*
 * Schedule E line 22 for a column (how-to-report-allowed-losses::b02–b03): Part
 * VIII column (c) for an activity listed there; otherwise the loss is allowed in
 * full, columns (b) and (c) of Parts IV and V. A positive amount, 0 when none is
 * allowed. Null when the column is not a passive activity on Form 8582; undefined
 * while Form 8582 waits (or is not filed).
 */
export function allowedLossForColumn(
  read: FieldReader,
  info: ActivitiesInfo,
  column: PropertyColumn,
): number | null | undefined {
  const activities = passiveActivities(info, (entry) =>
    read(`schedule-e.0.line.21_income_or_loss_${entry}`),
  );
  if (!activities) return undefined;
  const loss = activityLoss(activities, column);
  if (loss === undefined) return null;
  const allocation = lossAllocation(read, info);
  if (!allocation) return undefined;
  const listed = allocation.part8.find((row) => row.column === column);
  return listed ? listed.allowed : loss;
}
