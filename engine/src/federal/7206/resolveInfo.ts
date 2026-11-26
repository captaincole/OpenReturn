import {
  ADJUSTMENT_KEYS,
  businessesOnReturn,
  farmsOnReturn,
  getSelfEmployedHealthPlanFacts,
  readK1Facts,
  type SelfEmployedHealthPlanFact,
} from "../../facts/index.js";
import { atLeast, roundDollars, sum } from "../../money.js";
import { filingStatusOf, num, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import { resolve2555Info } from "../2555/resolveInfo.js";
import { resolve8962Info } from "../8962/resolveInfo.js";
import { netProfit } from "../schedule-c/lines.js";
import { netFarmProfit } from "../schedule-f/lines.js";
import type { Form7206FilingInfo, SelfEmployedHealthPlan } from "./filingInfo.js";
import { activityCount, planOf, type PlanContext } from "./plans.js";

/* Schedule K-1 (Form 1065) box 14, code A: net earnings from self-employment. */
const PARTNER_EARNINGS_BOX = { box: "14", code: "A" };

/* The partnership K-1s on the return that show box 14 code A earnings (a source of SE income). */
function partnershipEarningsCount(inputs: ResolverInputs): number {
  return readK1Facts(inputs.facts).k1s.filter(
    (k1) =>
      k1.value.form === "1065" &&
      k1.value.boxes.some(
        (each) =>
          each.box === PARTNER_EARNINGS_BOX.box &&
          each.code === PARTNER_EARNINGS_BOX.code &&
          (each.amount ?? 0) !== 0,
      ),
  ).length;
}

function contextOf(inputs: ResolverInputs): PlanContext {
  const status = filingStatusOf(inputs);
  const joint = status === undefined || status === "married_filing_jointly";
  const form2555 = resolve2555Info(inputs);
  return {
    inputs,
    joint,
    businesses: businessesOnReturn(inputs.facts, joint),
    farms: farmsOnReturn(inputs.facts, joint),
    partnerEarnings: partnershipEarningsCount(inputs) > 0,
    form8962Files: resolve8962Info(inputs).mustFile?.["form-8962"]?.value === true,
    form2555Files: form2555.mustFile?.["form-2555"]?.value === true,
    form2555Filers: form2555.form2555Filers ?? [],
    selfEmployedPlanDeduction: num(inputs, ADJUSTMENT_KEYS.selfEmployedPlanDeduction),
    longTermCareUsed: new Map(),
  };
}

/*
 * Line 5: "the total of all net profits from Schedule C (Form 1040), line 31;
 * Schedule F (Form 1040), line 34; or Schedule K-1 (Form 1065), box 14, code A
 * ... Don't include Conservation Reserve Program payments exempt from
 * self-employment tax ... Don't include any net losses" (irs-7206-face-2025::sec::face-page-1::b03).
 * Whole dollars; undefined while a line 31 or 34 waits. A K-1 with box 14 code
 * A makes every Schedule C or F plan a gap (plans.ts), so none is added here.
 */
function line5(ctx: PlanContext): number | undefined {
  const all = ctx.businesses.businesses.map((each) => each.value);
  const businesses = ctx.businesses.businesses.map((each) =>
    roundDollars(netProfit(each.value, all)),
  );
  const farms = ctx.farms.farms.map((each) => {
    const result = netFarmProfit(each.value, each.key);
    if (result.kind !== "amount") return undefined;
    const crp = roundDollars(each.value.crpPaymentsWhileReceivingSocialSecurity ?? 0);
    return roundDollars(result.amount) - crp;
  });
  const profits = [...businesses, ...farms];
  if (profits.some((each) => each === undefined)) return undefined;
  return sum(...profits.map((each) => atLeast(0, each)));
}

/*
 * Who must use Form 7206 instead of the Form 1040 worksheet: more than one
 * source of income subject to self-employment tax, Form 2555, or long-term
 * care premiums (irs-7206-inst-2025::sec::general-instructions::b04, ::b05;
 * irs-1040-inst-2025::sec::line-17::b06); and a separate form for each plan
 * (general-instructions::b06).
 *
 * DECISION (2026-11-26, by the author): a plan under an S corporation on a
 * return that also has self-employment income files Form 7206. Text A, the Form
 * 1040 worksheet line 2: earned income "minus any deductions on Schedule 1,
 * lines 15 and 16", where earned income for a more-than-2% shareholder "is your
 * Medicare wages (box 5 of Form W-2) from that corporation"
 * (irs-1040-inst-2025::sec::line-17::b04, ::b05). Text B, Form 7206: "If the
 * business is an S corporation, skip to line 11", and line 13 takes line 11
 * less only line 12 (irs-7206-face-2025::sec::face-page-1::b02, ::b03). The
 * engine follows Text B for every plan: lines 15 and 16 belong to the other
 * business, and filing Form 7206 is always allowed ("Generally, you can use the
 * worksheet", ::b04).
 */
function mustUseForm(
  ctx: PlanContext,
  plans: SelfEmployedHealthPlan[],
  facts: SelfEmployedHealthPlanFact[],
) {
  const sources = activityCount(ctx) + partnershipEarningsCount(ctx.inputs);
  const longTermCare = facts.some((fact) =>
    (fact.value.longTermCare ?? []).some((each) => each.premiumsPaid > 0),
  );
  const sCorporationWithSelfEmployment =
    plans.some((plan) => plan.kind === "s_corporation") && sources > 0;
  return (
    plans.length > 1 ||
    sources > 1 ||
    ctx.form2555Files ||
    longTermCare ||
    sCorporationWithSelfEmployment
  );
}

/*
 * Who files: a self-employed person, partner or more-than-2% S corporation
 * shareholder with a plan established under the business uses Form 7206 when
 * mustUseForm says so; otherwise the Form 1040 worksheet figures Schedule 1
 * line 17 with the same arithmetic and no form files. The decision still wins.
 */
export function resolve7206Info(inputs: ResolverInputs): Form7206FilingInfo {
  const facts = getSelfEmployedHealthPlanFacts(inputs.facts);
  const ctx = contextOf(inputs);
  const plans = facts.map((fact) => planOf(ctx, fact));
  const required = facts.length > 0 && mustUseForm(ctx, plans, facts);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_7206",
    fallbacks: [
      {
        rule: `fallback: ${facts.length} self-employed health plan(s); Form 7206 required (more than one plan or source of self-employment income, Form 2555, long-term care, or an S corporation plan next to self-employment income): ${required}`,
        value: required,
        triggeredByFactKeys: facts.map((fact) => fact.key),
      },
    ],
  });
  return {
    mustFile: { "form-7206": mustFile },
    form7206Plans: plans.length > 0 ? plans : undefined,
    form7206Line5: plans.length > 0 ? line5(ctx) : undefined,
  };
}
