/*
 * Each plan's Form 7206 lines, with the other forms' lines it reads: Schedule 1
 * lines 15 and 16 and Form 2555 line 45. The engine evaluates only the first
 * copy, so Schedule 1 line 17 and QBI figure every plan here, as Form 2555's
 * totals do.
 */

import type { BaseFilingInfo } from "../../filingInfo.js";
import { atLeast, numberOrBlank, roundDollars, sum } from "../../money.js";
import { unsupported, type Unsupported } from "../../types.js";
import { line45Of, type ReturnAccessor } from "../2555/results.js";
import type { Form7206FilingInfo, SelfEmployedHealthPlan } from "./filingInfo.js";
import { businessPlanLines, sCorporationPlanLines, type Form7206Lines } from "./lines.js";

export type Form7206ResultInfo = BaseFilingInfo &
  Pick<Form7206FilingInfo, "form7206Plans" | "form7206Line5" | "form2555Filers">;

type Result<T> = T | Unsupported | undefined;

/* Schedule 1 line 15, the deductible part of self-employment tax; line 16, the self-employed plans. */
const SCHEDULE_1_LINE_15 = "schedule-1.1.line.15";
const SCHEDULE_1_LINE_16 = "schedule-1.1.line.16";

const isGap = (value: unknown): value is Unsupported =>
  typeof value === "object" && value !== null && (value as Unsupported).unsupported === true;

/* Line 7's Schedule 1 line 15: 0 when Schedule SE does not file; undefined while it waits. */
function selfEmploymentTaxDeduction(
  form: ReturnAccessor,
  info: Form7206ResultInfo,
): number | undefined {
  const files = info.mustFile?.["schedule-se"]?.value;
  if (files === false) return 0;
  if (files === undefined) return undefined;
  return numberOrBlank(form[SCHEDULE_1_LINE_15]);
}

/* Line 9: the stated part of Schedule 1 line 16, or all of it (plans.ts). */
function line9(plan: SelfEmployedHealthPlan, form: ReturnAccessor): number {
  if (plan.line9Source === "line16") return numberOrBlank(form[SCHEDULE_1_LINE_16]) ?? 0;
  return roundDollars(plan.line9Source);
}

/*
 * Line 12: blank without the person's Form 2555 ({}), 0 when none of it is this
 * business's, else Form 2555 line 45, not below 0 (QUESTIONS.md question 5).
 * Undefined while line 45 waits.
 */
function line12(
  plan: SelfEmployedHealthPlan,
  form: ReturnAccessor,
  info: Form7206ResultInfo,
): Result<{ amount?: number }> {
  const source = plan.line12Source;
  if (source === "none") return {};
  if (source === "zero") return { amount: 0 };
  if (typeof source === "object") return unsupported(source.gap);
  const filer = info.form2555Filers?.find((each) => each.owner === plan.owner);
  if (filer === undefined) return undefined;
  const line45 = line45Of(filer, form, info);
  if (typeof line45 !== "number") return line45;
  return { amount: atLeast(0, line45) };
}

/* One plan's Form 7206: its lines, the gap, or undefined while a line it reads waits. */
export function planLines(
  plan: SelfEmployedHealthPlan,
  form: ReturnAccessor,
  info: Form7206ResultInfo,
): Result<Form7206Lines> {
  if (plan.gap) return unsupported(plan.gap);
  const foreign = line12(plan, form, info);
  if (foreign === undefined || isGap(foreign)) return foreign;
  if (plan.kind === "s_corporation") {
    if (plan.line11 === undefined) return undefined;
    return sCorporationPlanLines({
      premiums: plan.premiums,
      line11: plan.line11,
      line12: foreign.amount,
    });
  }
  const line15 = selfEmploymentTaxDeduction(form, info);
  const line5 = info.form7206Line5;
  if (plan.line4 === undefined || line5 === undefined || line15 === undefined) return undefined;
  return businessPlanLines({
    premiums: plan.premiums,
    line4: plan.line4,
    line5,
    line15,
    line9: line9(plan, form),
    line12: foreign.amount,
  });
}

/* Line 14 of several plans: the first gap, else undefined while any waits, else the sum. */
function deductionOf(
  plans: ReadonlyArray<SelfEmployedHealthPlan>,
  form: ReturnAccessor,
  info: Form7206ResultInfo,
): Result<number> {
  const results = plans.map((plan) => planLines(plan, form, info));
  const gap = results.find(isGap);
  if (gap !== undefined) return gap;
  const figured = results.filter(
    (each): each is Form7206Lines => each !== undefined && !isGap(each),
  );
  if (figured.length < results.length) return undefined;
  return sum(...figured.map((each) => each.line14));
}

/*
 * Schedule 1 line 17: line 14 of every Form 7206, or the Form 1040 worksheet's
 * line 3 when no form is required, which the same arithmetic gives
 * (resolveInfo.ts). Blank with no plan.
 */
export function selfEmployedHealthDeduction(
  form: ReturnAccessor,
  info: Form7206ResultInfo,
): Result<number> {
  const plans = info.form7206Plans ?? [];
  return plans.length === 0 ? undefined : deductionOf(plans, form, info);
}

/*
 * The deduction of the plans under one business or farm, for its QBI: "the
 * self-employment health insurance deduction" is an item attributable to the
 * trade or business (irs-8995a-inst-2025::sec::determining-your-qbi-deduction::b15).
 * 0 with no plan; undefined while one waits or is a gap (the QBI resolver
 * makes the business a gap for a plan's own gap).
 */
export function healthDeductionOfBusiness(
  businessKey: string,
  form: ReturnAccessor,
  info: Form7206ResultInfo,
): number | undefined {
  const plans = (info.form7206Plans ?? []).filter((plan) => plan.businessKey === businessKey);
  if (plans.length === 0) return 0;
  const total = deductionOf(plans, form, info);
  return typeof total === "number" ? total : undefined;
}
