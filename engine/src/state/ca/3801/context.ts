/*
 * What every FTB 3801 binding starts from: the resolver's California figures,
 * Parts IV and V, the lines of Side 1 and the loss allocation (Parts VI to
 * VIII). It reads other forms only by full field id (federal modified AGI,
 * Schedule E), so Schedule CA (540) line 5 computes the same amounts with its
 * own accessor.
 */

import type { PassiveActivities } from "../../../federal/8582/activities.js";
import { allocateLosses, type LossAllocation } from "../../../federal/8582/allocation.js";
import { modifiedAgi, type MagiFields } from "../../../federal/8582/magi.js";
import { MAGI_WITH_K1_GAP } from "../../../federal/8582/magiGap.js";
import { unsupported, type Unsupported } from "../../../types.js";
import { partsOf } from "./afterLimits.js";
import type { CaScheduleEActivity } from "./californiaRentals.js";
import type { Form3801FilingInfo } from "./filingInfo.js";
import { form3801Lines, partIIOpen, type FilerStatus, type Form3801Lines } from "./lines.js";

export const ADOPTION_GAP =
  "Federal modified AGI (Form 8582 line 6, which FTB 3801 line 6 takes) adds back excluded employer adoption benefits, which need Form 8839; not modeled.";

export interface Form3801Context {
  activities: CaScheduleEActivity[];
  parts: PassiveActivities;
  lines: Form3801Lines;
  /* Line 6 is needed (Part II is open) and the engine cannot figure it. */
  magiGap?: string;
  /* Parts VI to VIII; undefined while line 6 waits. */
  allocation?: LossAllocation;
}

export type ContextResult = Form3801Context | Unsupported | undefined;

export const isUnsupportedResult = (value: unknown): value is Unsupported =>
  typeof value === "object" && (value as Unsupported | null)?.unsupported === true;

/* Line 6's gap: excluded adoption benefits, or a K-1 (federal/8582/magiGap.ts). */
function lineSixGap(info: Form3801FilingInfo): string | undefined {
  if ((info.adoptionBenefits ?? 0) > 0) return ADOPTION_GAP;
  return (info.passThroughEntities ?? []).length > 0 ? MAGI_WITH_K1_GAP : undefined;
}

/* The filer's status for line 5 and the MFS rule. */
export function filerOf(info: Form3801FilingInfo): FilerStatus {
  return {
    marriedFilingSeparately: info.filingStatus === "married_filing_separately",
    livedApartAllYear: info.livedApartFromSpouseAllYear,
  };
}

/*
 * The context, a gap that covers the whole form, or undefined while an answer
 * is missing. Line 6 is federal Form 8582 line 6 (ca-3801-inst-2025::sec::part-ii::b02),
 * figured by the federal rule (magi.ts) whether or not Form 8582 files
 * ("If you have not already done so, complete federal Form 8582", part-ii::b01).
 */
export function contextOf(form: MagiFields, info: Form3801FilingInfo): ContextResult {
  const figures = info.form3801Figures;
  if (figures?.gap) return unsupported(figures.gap);
  if (!figures?.activities) return undefined;
  const activities = figures.activities;
  const parts = partsOf(activities);
  const filer = filerOf(info);
  const before = form3801Lines(parts, filer, undefined);
  const open = partIIOpen(before, filer);
  const magiGap = open ? lineSixGap(info) : undefined;
  const magi = open && !magiGap ? modifiedAgi(form, info) : undefined;
  const lines = open ? form3801Lines(parts, filer, magi) : before;
  const allocation = magiGap ? undefined : allocateLosses(parts, lines.line3, lines.line9);
  return { activities, parts, lines, magiGap, allocation };
}

type Reader<T> = (context: Form3801Context) => T;

/*
 * A binding from the context: a gap or a wait passes through; a field that
 * reads line 6 shows line 6's gap.
 */
export function fromContext<T>(read: Reader<T>, readsLine6 = false) {
  return (form: MagiFields, info: Form3801FilingInfo): T | Unsupported | undefined => {
    const context = contextOf(form, info);
    if (context === undefined || isUnsupportedResult(context)) return context;
    if (readsLine6 && context.magiGap) return unsupported(context.magiGap);
    return read(context);
  };
}
