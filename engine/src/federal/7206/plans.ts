/*
 * Each plan fact as a SelfEmployedHealthPlan: lines 1, 2, 4 and 11 from facts,
 * where lines 9 and 12 come from, and why a plan cannot be figured. Lines 7,
 * 9 and 12 read other forms' lines, so results.ts figures them.
 */

import {
  businessesOnReturn,
  farmOwnerOf,
  farmsOnReturn,
  isW2FactKey,
  ownerOf,
  type ForeignEarnedIncomeFactValue,
  type SelfEmployedHealthPlanFact,
  type W2FactValue,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { w2Owner, type ResolverInputs } from "../../resolverInputs.js";
import type { Form2555Filer } from "../2555/person.js";
import { netProfit } from "../schedule-c/lines.js";
import { netFarmProfit } from "../schedule-f/lines.js";
import type { ForeignExclusionSource, SelfEmployedHealthPlan } from "./filingInfo.js";
import { longTermCareLine2 } from "./lines.js";

export const GAPS = {
  partnership:
    "The plan is established under a partnership: Schedule SE takes no partnership earnings (Schedule K-1 (Form 1065) box 14, code A), so Schedule 1 line 15 and Form 7206 lines 4, 5 and 7 cannot be figured.",
  partnerEarnings:
    "A partnership K-1 on the return shows net earnings from self-employment (box 14, code A): Form 7206 line 5 adds them, and Schedule SE, which the engine figures from Schedules C and F only, leaves them out of Schedule 1 line 15.",
  spouseBusiness:
    "A business or farm on this joint return is the spouse's: the spouse's Schedule SE is not modeled, so Schedule 1 line 15, which line 7 shares out, is not known.",
  missingBusiness: "The plan names a business, farm or W-2 that is not on the return.",
  noBox5:
    "The S corporation's W-2 shows no Medicare wages (box 5), which line 11 takes (irs-7206-face-2025::sec::face-page-1::b03).",
  marketplace:
    "The plan was bought through the Marketplace and Form 8962 files: Pub. 974 figures the deduction and the premium tax credit together (irs-7206-inst-2025::sec::general-instructions::b06), which the engine does not model.",
  sharedRetirementPlan:
    "Schedule 1 line 16 has an amount and the return has more than one business or farm: line 9 takes only the part for this business, and the plan fact does not state it.",
  foreignMixed:
    "Form 2555 excludes income from more than this business: line 12 takes only the part of line 45 attributable to it, and no rule shares line 45 out.",
} as const;

/* The return's activities, read once for every plan. */
export interface PlanContext {
  inputs: ResolverInputs;
  joint: boolean;
  businesses: ReturnType<typeof businessesOnReturn>;
  farms: ReturnType<typeof farmsOnReturn>;
  /* A partnership K-1 shows box 14 code A earnings. */
  partnerEarnings: boolean;
  form8962Files: boolean;
  /* Form 2555 files; each person's form. */
  form2555Files: boolean;
  form2555Filers: Form2555Filer[];
  selfEmployedPlanDeduction?: number;
  /* Long-term care already counted for each person on earlier copies. */
  longTermCareUsed: Map<string, number>;
}

/* Every business and farm on the return, the spouse's on a joint return too. */
export function activityCount(ctx: PlanContext): number {
  return ctx.businesses.businesses.length + ctx.farms.farms.length;
}

const spouseActivity = (ctx: PlanContext) =>
  ctx.businesses.businesses.some((each) => ownerOf(each.value) === "spouse") ||
  ctx.farms.farms.some((each) => farmOwnerOf(each.value) === "spouse");

type Part = Pick<SelfEmployedHealthPlan, "owner" | "line4" | "line11" | "gap">;

/* Line 4 for a Schedule C business: line 31, whole dollars. */
function businessPart(ctx: PlanContext, key: string): Part {
  const found = ctx.businesses.businesses.find((each) => each.key === key);
  if (!found) return { owner: "taxpayer", gap: GAPS.missingBusiness };
  const all = ctx.businesses.businesses.map((each) => each.value);
  return { owner: ownerOf(found.value), line4: roundDollars(netProfit(found.value, all)) };
}

/* Line 4 for a farm: line 34 less the CRP payments exempt from SE tax (the form's line 4). */
function farmPart(ctx: PlanContext, key: string): Part {
  const found = ctx.farms.farms.find((each) => each.key === key);
  if (!found) return { owner: "taxpayer", gap: GAPS.missingBusiness };
  const owner = farmOwnerOf(found.value);
  const result = netFarmProfit(found.value, key);
  if (result.kind === "gap") return { owner, gap: result.reason };
  if (result.kind === "waits") return { owner };
  const crp = roundDollars(found.value.crpPaymentsWhileReceivingSocialSecurity ?? 0);
  return { owner, line4: roundDollars(result.amount) - crp };
}

/* Line 11 for an S corporation: the W-2's box 5. */
function sCorporationPart(ctx: PlanContext, key: string): Part {
  const w2 = isW2FactKey(key) ? ctx.inputs.factByKey.get(key) : undefined;
  if (w2 === undefined) return { owner: "taxpayer", gap: GAPS.missingBusiness };
  const value = w2 as W2FactValue;
  const owner = w2Owner(ctx.inputs, value) ?? "taxpayer";
  if (typeof value.box5 !== "number") return { owner, gap: GAPS.noBox5 };
  return { owner, line11: roundDollars(value.box5) };
}

function partOf(ctx: PlanContext, fact: SelfEmployedHealthPlanFact): Part {
  const { kind, factKey } = fact.value.establishedUnder;
  if (kind === "s_corporation") return sCorporationPart(ctx, factKey);
  if (kind === "partnership") return { owner: "taxpayer", gap: GAPS.partnership };
  const part = kind === "schedule_c" ? businessPart(ctx, factKey) : farmPart(ctx, factKey);
  if (part.gap) return part;
  if (ctx.joint && spouseActivity(ctx)) return { ...part, gap: GAPS.spouseBusiness };
  if (ctx.partnerEarnings) return { ...part, gap: GAPS.partnerEarnings };
  return part;
}

/*
 * Line 9: "the amount, if any, from Schedule 1 (Form 1040), line 16 ...
 * attributable to the same trade or business" (the form). A stated amount; else
 * all of line 16 with one business or farm on the return, as QBI reads it
 * (qbi/resolveInfo.ts); else nothing to take with no line 16 amount.
 */
function line9Source(
  ctx: PlanContext,
  fact: SelfEmployedHealthPlanFact,
): number | "line16" | { gap: string } {
  if (fact.value.retirementPlanDeduction !== undefined) return fact.value.retirementPlanDeduction;
  if ((ctx.selfEmployedPlanDeduction ?? 0) <= 0) return 0;
  return activityCount(ctx) === 1 ? "line16" : { gap: GAPS.sharedRetirementPlan };
}

/* Income on the person's Form 2555 other than a business of their own (lines 19, 20b, 21–23). */
function hasOtherForeignIncome(answers: ForeignEarnedIncomeFactValue): boolean {
  return [
    answers.wages,
    answers.partnership,
    answers.noncash,
    answers.allowances,
    answers.otherIncome,
  ].some((each) => each !== undefined);
}

/*
 * Line 12: "any amount from Form 2555, line 45, attributable to the amount
 * entered on line 4 or 11" (the form). The engine settles it only when the
 * answer is all or nothing (QUESTIONS.md question 5).
 */
function line12Source(
  ctx: PlanContext,
  fact: SelfEmployedHealthPlanFact,
  owner: "taxpayer" | "spouse",
): ForeignExclusionSource {
  if (!ctx.form2555Files) return "none";
  const filer = ctx.form2555Filers.find((each) => each.owner === owner);
  if (!filer) return "none";
  const answers = filer.answers;
  if (fact.value.establishedUnder.kind === "s_corporation") {
    const employment = [answers.wages, answers.noncash, answers.allowances];
    return employment.every((each) => each === undefined) ? "zero" : { gap: GAPS.foreignMixed };
  }
  if (answers.business === undefined)
    return answers.partnership ? { gap: GAPS.foreignMixed } : "zero";
  const owned = activityCount(ctx) === 1;
  return owned && !hasOtherForeignIncome(answers) ? "line45" : { gap: GAPS.foreignMixed };
}

/* One plan fact as its Form 7206: amounts from facts, the sources of lines 9 and 12, any gap. */
export function planOf(ctx: PlanContext, fact: SelfEmployedHealthPlanFact): SelfEmployedHealthPlan {
  const { value } = fact;
  const part = partOf(ctx, fact);
  const line9 = line9Source(ctx, fact);
  const line12 = line12Source(ctx, fact, part.owner);
  const marketplace = value.throughMarketplace === true && ctx.form8962Files;
  const gap =
    part.gap ??
    (marketplace ? GAPS.marketplace : undefined) ??
    (typeof line9 === "object" && value.establishedUnder.kind !== "s_corporation"
      ? line9.gap
      : undefined) ??
    (typeof line12 === "object" ? line12.gap : undefined);
  return {
    factKey: fact.key,
    kind: value.establishedUnder.kind,
    businessKey: value.establishedUnder.factKey,
    owner: part.owner,
    premiums: {
      line1: roundDollars(sum(value.healthPremiums)),
      line2: longTermCareLine2(value.longTermCare ?? [], ctx.longTermCareUsed),
    },
    line4: part.line4,
    line11: part.line11,
    line9Source: typeof line9 === "object" ? 0 : line9,
    line12Source: line12,
    gap,
  };
}
