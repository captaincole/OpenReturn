import { bornBeforeJan2_1961 } from "./birthDate.js";
import {
  BLINDNESS_KEYS,
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  CA_PAYMENT_KEYS,
  NET_INVESTMENT_INCOME_KEYS,
  SPOUSE_KEYS,
  getSection1256Facts,
  isDividendFactKey,
  readBusinessPropertySaleFacts,
} from "./facts/index.js";
import { resolve4137Info } from "./federal/4137/resolveInfo.js";
import { resolve4797Info } from "./federal/4797/resolveInfo.js";
import { scheduleTwoNeededForEarlyDistributions } from "./federal/5329/resolveInfo.js";
import { resolve6251Info } from "./federal/6251/resolveInfo.js";
import { form6252TotalsOf } from "./federal/6252/resolveInfo.js";
import { form8621Feeds } from "./federal/8621/totals.js";
import { sendsToScheduleD } from "./federal/8824/receivers.js";
import { resolve8824Info } from "./federal/8824/resolveInfo.js";
import { resolve8853Info } from "./federal/8853/resolveInfo.js";
import { SCHEDULE_2_LINES, form8853Reaches } from "./federal/8853/results.js";
import { resolve8919Info } from "./federal/8919/resolveInfo.js";
import { cleanVehicleSchedules } from "./federal/8936/resolveInfo.js";
import { planForm8949Copies, totalsByBox } from "./federal/8949/copyPlan.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import { resolve8959Info } from "./federal/8959/resolveInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import { installmentSalesWithoutTradeOrBusinessAnswer } from "./federal/8960/line5b.js";
import { NIIT_THRESHOLDS, rentalsWithoutTradeOrBusinessAnswer } from "./federal/8960/lines.js";
import { investmentSignals, magiUpperBound } from "./federal/8960/mustFile.js";
import { resolve8962Info } from "./federal/8962/resolveInfo.js";
import {
  k1KeysWithRoute,
  receivedAt,
  receivedOnReturn,
  routedOnReturn,
} from "./federal/passThrough/receipts.js";
import type { Route } from "./federal/passThrough/routing.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import { resolveScheduleAInfo } from "./federal/schedule-a/resolveInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import { resolveScheduleEInfo } from "./federal/schedule-e/resolveInfo.js";
import { resolveScheduleHInfo } from "./federal/schedule-h/resolveInfo.js";
import { resolveScheduleSEInfo } from "./federal/schedule-se/resolveInfo.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import { sumOrBlank, type Money } from "./money.js";
import {
  factsInCategory,
  filingStatusOf,
  hasW2,
  missingInputs,
  num,
  reportableSalesFallbacks,
  resolveMustFile,
  sumCaSdi,
  sumInvestmentBox,
  sumW2Box,
  text,
  type ResolverInputs,
} from "./resolverInputs.js";
import type { Form540FilingInfo } from "./state/ca/540/filingInfo.js";
import { californiaWithholdingOtherForms } from "./state/ca/540/withholding.js";
import { resolveActivityAdjustments } from "./state/ca/schedule-ca/activities.js";
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import { phone, ssn } from "./values.js";

export { resolveSchedule1Info } from "./federal/schedule-1/resolveInfo.js";
export { resolveScheduleBInfo } from "./federal/schedule-b/resolveInfo.js";
export { makeResolverInputs, type ResolverInputs } from "./resolverInputs.js";

export function resolveBaseInfo(inputs: ResolverInputs): BaseFilingInfo {
  const filingStatus = filingStatusOf(inputs);
  const ssnRaw = text(inputs, "identity.ssn");
  const spouseSsnRaw = text(inputs, SPOUSE_KEYS.ssn);
  const phoneRaw = text(inputs, "identity.phone");
  const dob = text(inputs, "identity.dob");
  const spouseDob = text(inputs, SPOUSE_KEYS.dob);

  return {
    filingStatus,
    taxpayerFirstName: text(inputs, "identity.name.first"),
    taxpayerMiddleInitial: text(inputs, "identity.name.middle_initial"),
    taxpayerLastName: text(inputs, "identity.name.last"),
    taxpayerSSN: ssnRaw ? ssn(ssnRaw) : undefined,
    taxpayerDateOfBirth: dob,
    taxpayerBornBeforeJan2_1961: bornBeforeJan2_1961(dob),
    spouseFirstName: text(inputs, SPOUSE_KEYS.firstName),
    spouseMiddleInitial: text(inputs, SPOUSE_KEYS.middleInitial),
    spouseLastName: text(inputs, SPOUSE_KEYS.lastName),
    spouseSSN: spouseSsnRaw ? ssn(spouseSsnRaw) : undefined,
    spouseDateOfBirth: spouseDob,
    spouseBornBeforeJan2_1961: bornBeforeJan2_1961(spouseDob),
    taxpayerBlind: inputs.factByKey.get(BLINDNESS_KEYS.taxpayer) === true,
    spouseBlind: inputs.factByKey.get(BLINDNESS_KEYS.spouse) === true,
    spouseOccupation: text(inputs, SPOUSE_KEYS.occupation),
    taxpayerOccupation: text(inputs, "identity.occupation"),
    taxpayerPhone: phoneRaw ? phone(phoneRaw) : undefined,
    taxpayerEmail: text(inputs, "identity.email"),
    homeAddressLine1: text(inputs, "identity.address.street"),
    homeAddressApt: text(inputs, "identity.address.apt"),
    homeAddressCity: text(inputs, "identity.address.city"),
    homeAddressState: text(inputs, "identity.address.state"),
    homeAddressZip: text(inputs, "identity.address.zip"),
    homeAddressCounty: text(inputs, "identity.address.county"),
    fullYearMEC: inputs.factByKey.get("health_coverage.full_year_mec") as boolean | undefined,
  };
}

/* Form 540 line 5: a qualifying surviving spouse/RDP enters the year the spouse died. */
function spouseYearOfDeathInput(inputs: ResolverInputs): Record<string, unknown> {
  if (filingStatusOf(inputs) !== "qualifying_surviving_spouse") return {};
  return { [SPOUSE_KEYS.yearOfDeath]: text(inputs, SPOUSE_KEYS.yearOfDeath) };
}

/* Form 540 line 9: on a joint return the spouse's age adds a senior exemption. */
function spouseDobInput(inputs: ResolverInputs): Record<string, unknown> {
  if (filingStatusOf(inputs) !== "married_filing_jointly") return {};
  return { [SPOUSE_KEYS.dob]: text(inputs, SPOUSE_KEYS.dob) };
}

/* The spouse answers Form 540 reads: lines 5 and 9. */
const spouseInputs = (inputs: ResolverInputs) => ({
  ...spouseYearOfDeathInput(inputs),
  ...spouseDobInput(inputs),
});

export function resolve540Info(inputs: ResolverInputs): Form540FilingInfo {
  const { decisionByKey, factByKey } = inputs;
  const resolution = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_ca_540",
  });
  const useTaxOwed = num(inputs, "use_tax.owed_amount");
  const useTaxZeroReason = decisionByKey.get("decisions.scope.use_tax_zero_reason");
  return {
    mustFile: { "form-540": resolution },
    missingInputs: {
      "form-540": missingInputs({
        "identity.address.county": text(inputs, "identity.address.county"),
        // Line 9: 65 or older by December 31 adds the senior exemption.
        "identity.dob": text(inputs, "identity.dob"),
        "health_coverage.full_year_mec": factByKey.get("health_coverage.full_year_mec"),
        "use_tax.owed_amount": useTaxOwed,
        /* Line 91 takes an amount, or the "no use tax owed" reason when there is none. */
        ...(useTaxOwed !== undefined && useTaxOwed > 0
          ? {}
          : { "decisions.scope.use_tax_zero_reason": useTaxZeroReason }),
        "decisions.scope.mailing_same_as_principal_residence": decisionByKey.get(
          "decisions.scope.mailing_same_as_principal_residence",
        ),
        "decisions.refund.refund_full_overpayment_ca": decisionByKey.get(
          "decisions.refund.refund_full_overpayment_ca",
        ),
        ...spouseInputs(inputs),
      }),
    },
    spouseYearOfDeath: text(inputs, SPOUSE_KEYS.yearOfDeath),
    caResidencyStatus: decisionByKey.get("decisions.scope.ca_residency") as string | undefined,
    // No W-2 at all: lines 12 and 71 stay blank, not "0".
    w2StateWages: hasW2(inputs)
      ? (sumW2Box(inputs, "box16") as Form540FilingInfo["w2StateWages"])
      : undefined,
    w2StateWithholding: hasW2(inputs)
      ? (sumW2Box(inputs, "box17") as Form540FilingInfo["w2StateWithholding"])
      : undefined,
    caWithholdingOtherForms: californiaWithholdingOtherForms(inputs),
    w2CaSdiTotal: sumCaSdi(factsInCategory(inputs, "wages")) as Form540FilingInfo["w2CaSdiTotal"],
    useTaxOwed: useTaxOwed as Form540FilingInfo["useTaxOwed"],
    noUseTaxOwed: useTaxZeroReason === "no_use_tax_owed" ? true : undefined,
    useTaxZeroReason: typeof useTaxZeroReason === "string" ? useTaxZeroReason : undefined,
    mailingSameAsResidence: decisionByKey.get(
      "decisions.scope.mailing_same_as_principal_residence",
    ) as boolean | undefined,
    refundFullOverpaymentCA: decisionByKey.get("decisions.refund.refund_full_overpayment_ca") as
      boolean | undefined,
    ...caPayments(inputs),
  };
}

/* Line 72: the California payments the taxpayer states, blank when none is recorded. */
function caPayments(
  inputs: ResolverInputs,
): Pick<Form540FilingInfo, "caEstimatedAndOtherPayments"> {
  return {
    caEstimatedAndOtherPayments: sumOrBlank(
      num(inputs, CA_PAYMENT_KEYS.estimatedTax),
      num(inputs, CA_PAYMENT_KEYS.priorYearOverpaymentApplied),
      num(inputs, CA_PAYMENT_KEYS.extensionPayment),
    ) as Money | undefined,
  };
}

// Default: file with Form 540. Set the explicit decision false to opt out.
export function resolveScheduleCaInfo(inputs: ResolverInputs): ScheduleCaFilingInfo {
  const files540 = inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_ca",
    fallbacks: [
      {
        rule: "fallback: must_file_ca_540 = true",
        value: files540,
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  const caInvestmentFees = num(inputs, CA_MISC_DEDUCTION_KEYS.investmentFees);
  // Part II waits with the increased standard deduction, so line 21 asks nothing then.
  const { mustFile, increasedStandardDeduction: raised } = resolveScheduleAInfo(inputs);
  const itemizes = mustFile?.["schedule-a"]?.value === true && raised === false;
  const { activityMissingInputs, ...activities } = resolveActivityAdjustments(inputs);
  return {
    mustFile: { "schedule-ca": resolution },
    /* A California itemizer states the fees once (Part II line 21); 0 is an answer. */
    missingInputs: {
      "schedule-ca": [
        ...(files540 && itemizes
          ? missingInputs({ [CA_MISC_DEDUCTION_KEYS.investmentFees]: caInvestmentFees })
          : []),
        ...activityMissingInputs,
      ],
    },
    caInvestmentFees,
    ...activities,
  };
}

export function resolve8949Info(inputs: ResolverInputs): Form8949FilingInfo {
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8949",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  return {
    mustFile: { "form-8949": resolution },
    /* Column (a) needs the number of shares; a trade with none asks for it. */
    missingInputs: { "form-8949": inputs.trades.missingQuantityKeys },
    shortTermTrades: inputs.trades.short,
    longTermTrades: inputs.trades.long,
    form8949Copies: planForm8949Copies(inputs.trades.boxed),
    form8949BoxTotals: totalsByBox(inputs.trades.boxed),
  };
}

/*
 * Also fires for capital-gain distributions without 8949, for a capital loss
 * carried over from last year: Schedule D lines 6 and 14 take it
 * (irs-1040sd-inst-2025::sec::capital-loss-carryover-worksheet-lines-6-and-14::b02),
 * and for a section 1256 contract: Form 6781 lines 8 and 9 go on lines 4 and 11
 * (irs-6781-form-2025::sec::line-8::b01, line-9::b01).
 */
export function resolveScheduleDInfo(inputs: ResolverInputs): ScheduleDFilingInfo {
  const carryoverKeys = Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).filter(
    (key) => (num(inputs, key) ?? 0) > 0,
  );
  const section1256Keys = getSection1256Facts(inputs.facts).map((fact) => fact.key);
  // irs-1041k1-inst-2025::sec::boxes-3-and-4a-net-short-term-and-net::b01: lines 5 and 12.
  const k1Keys = [...new Set(SCHEDULE_D_ROUTES.flatMap((route) => k1KeysWithRoute(inputs, route)))];
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_d",
    fallbacks: [
      ...reportableSalesFallbacks(inputs),
      {
        rule: "fallback: a capital loss carryover from last year",
        value: carryoverKeys.length > 0,
        triggeredByFactKeys: carryoverKeys,
      },
      {
        rule: "fallback: a section 1256 contract (Form 6781 Part I)",
        value: section1256Keys.length > 0,
        triggeredByFactKeys: section1256Keys,
      },
      {
        rule: "fallback: a Schedule K-1 capital gain or loss (lines 5 and 12)",
        value: k1Keys.length > 0,
        triggeredByFactKeys: k1Keys,
      },
      form8621Feeds(inputs).scheduleDFallback,
      form4797Fallback(inputs),
      form6252Fallback(inputs),
      form8824Fallback(inputs),
    ],
  });
  const distributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  const routed = routedOnReturn(inputs);
  const positive = (value: number | undefined): Money | undefined =>
    value !== undefined && value > 0 ? (value as Money) : undefined;
  return {
    mustFile: { "schedule-d": resolution },
    capitalGainDistributions: positive(distributions),
    shortTermLossCarryover: positive(num(inputs, CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm)),
    longTermLossCarryover: positive(num(inputs, CAPITAL_LOSS_CARRYOVER_KEYS.longTerm)),
    passThroughShortTermGain: receivedAt(routed, "schedule_d_line_5"),
    passThroughLongTermGain: receivedAt(routed, "schedule_d_line_12"),
    passThrough28RateGain: receivedAt(routed, "schedule_d_line_18"),
    passThroughUnrecaptured1250Gain: receivedAt(routed, "schedule_d_line_19"),
    dividendUnrecaptured1250Gain: positive(sumInvestmentBox(inputs, "box2b", isDividendFactKey)),
    dividendCollectiblesGain: positive(sumInvestmentBox(inputs, "box2d", isDividendFactKey)),
  };
}

/*
 * A Form 4797 section 1231 gain goes to line 11 as a long-term capital gain
 * (irs-4797-inst-2025::sec::line-7::b01, line-9::b01). While the line 8 answer is
 * missing, the gain may still go there.
 */
function form4797Fallback(inputs: ResolverInputs) {
  const form4797 = resolve4797Info(inputs).form4797;
  const sends = (form4797?.scheduleDGain ?? 0) > 0 || form4797?.waitsForLine8 === true;
  return {
    rule: "fallback: a Form 4797 section 1231 gain (line 11)",
    value: sends,
    triggeredByFactKeys: sends
      ? readBusinessPropertySaleFacts(inputs.facts).sales.map((sale) => sale.key)
      : [],
  };
}

/*
 * A Form 6252 gain on a capital asset goes on line 4 or line 11
 * (irs-pub-537-2025::sec::reporting-an-installment-sale::b03).
 */
function form6252Fallback(inputs: ResolverInputs) {
  const forms = form6252TotalsOf(inputs)?.forms ?? [];
  const keys = forms.filter((form) => form.sale.use === "capital_asset").map((form) => form.key);
  return {
    rule: "fallback: a Form 6252 installment sale of a capital asset (line 4 or 11)",
    value: keys.length > 0,
    triggeredByFactKeys: keys,
  };
}

/*
 * A Form 8824 gain or (loss) goes on line 4 or 11 (the Schedule D lines;
 * irs-8824-inst-2025::sec::line-22::b01, line-36::b01).
 */
function form8824Fallback(inputs: ResolverInputs) {
  const totals = resolve8824Info(inputs).form8824Totals;
  const sends = sendsToScheduleD(totals);
  return {
    rule: "fallback: a Form 8824 gain or (loss) (lines 4 and 11)",
    value: sends,
    triggeredByFactKeys: sends ? (totals?.fileKeys ?? []) : [],
  };
}

const SCHEDULE_D_ROUTES: Route[] = [
  "schedule_d_line_5",
  "schedule_d_line_12",
  "schedule_d_line_18",
  "schedule_d_line_19",
];

/*
 * irs-8960-inst-2025::sec::who-must-file::b01 and application-to-individuals::b01:
 * MAGI over the filing-status threshold, with investment income (investmentSignals).
 * MAGI is an upper bound from facts (magiUpperBound), so a missed 8960 needs income
 * with no facts; set decisions.scope.must_file_8960 for that case.
 */
/* Line 4b's rental answers, and line 5b's Form 6252 business sale answers (worksheet line 2(d)). */
function tradeOrBusinessAnswersMissing(
  inputs: ResolverInputs,
  rentalProperties: Form8960FilingInfo["rentalProperties"],
): string[] {
  return [
    ...rentalsWithoutTradeOrBusinessAnswer(rentalProperties ?? []),
    ...installmentSalesWithoutTradeOrBusinessAnswer(form6252TotalsOf(inputs)?.forms ?? []),
  ];
}

export function resolve8960Info(inputs: ResolverInputs): Form8960FilingInfo {
  const status = filingStatusOf(inputs);
  const threshold = status ? NIIT_THRESHOLDS[status] : undefined;
  // With no filing status yet, count a spouse's income too, and test the lowest threshold.
  const joint = status === undefined || status === "married_filing_jointly";
  const { hasInvestment, ...signals } = investmentSignals(inputs, joint);
  const magi = magiUpperBound(inputs, joint);
  const underEvery = magi <= Math.min(...Object.values(NIIT_THRESHOLDS));
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8960",
    fallbacks:
      threshold === undefined && hasInvestment && !underEvery
        ? []
        : [
            {
              rule: `fallback: investment income present (${hasInvestment}) and MAGI (upper bound) $${magi} > $${threshold ?? "?"}`,
              value: hasInvestment && threshold !== undefined && magi > threshold,
            },
          ],
  });
  // Line 9b (…::sec::line-9b-state-local-and-foreign-income-tax::b02): the taxpayer's allocation.
  const allocableTax = num(inputs, "state_local_tax.allocable_to_investment_income");
  const itemizes = resolveScheduleAInfo(inputs).mustFile?.["schedule-a"]?.value === true;
  const asked = resolution.value === true && itemizes;
  // Line 4b reads Schedule E's lines, so only while Schedule E files.
  const scheduleE = resolveScheduleEInfo(inputs);
  const rentalProperties =
    scheduleE.mustFile?.["schedule-e"]?.value === true ? scheduleE.rentalProperties : undefined;
  const openAnswers =
    resolution.value === true ? tradeOrBusinessAnswersMissing(inputs, rentalProperties) : [];
  // Line 10 (…::sec::line-10-additional-modifications::b01): optional, recorded only when stated.
  const additionalModifications = num(inputs, NET_INVESTMENT_INCOME_KEYS.additionalModifications);
  return {
    mustFile: { "form-8960": resolution },
    missingInputs: {
      "form-8960": [
        ...(asked
          ? missingInputs({ "state_local_tax.allocable_to_investment_income": allocableTax })
          : []),
        ...openAnswers,
      ],
    },
    // Line 4b's scheduleCNonpassive; line 5b's nonpassiveBusinessKeys and capitalLossCarriedIn.
    ...signals,
    rentalProperties,
    stateLocalTaxAllocableToInvestmentIncome: allocableTax,
    additionalModifications,
    passThroughBusiness: receivedOnReturn(inputs, "schedule_e_part_ii"),
    passThroughNetInvestmentAdjustment: receivedOnReturn(inputs, "form_8960_line_7"),
  };
}

/*
 * Default: required when Schedule SE (line 4), Form 4137 (line 5), Form 8919
 * (line 6), Form 8959 (line 11), Form 8960 (line 12), Schedule H (line 9), Form 6251 (line 2) or
 * Form 8962 (line 1a) is filed, an early distribution owes the additional tax
 * (line 8), or Form 8853 has an additional tax for lines 17e and 17f. While
 * none is filed and one is still undecided, Schedule 2 is undecided too. KNOWN
 * GAP: the resolver cannot see Form 6251 line 11 or Form 8962 line 29,
 * so a filed Form 6251 with no AMT, or a Form 8962 with no repayment, still files
 * Schedule 2 with 0 or blank lines.
 */
export function resolveSchedule2Info(inputs: ResolverInputs): Schedule2FilingInfo {
  const feeders = [
    resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value,
    resolve4137Info(inputs).mustFile?.["form-4137"]?.value,
    resolve8919Info(inputs).mustFile?.["form-8919"]?.value,
    resolve8959Info(inputs).mustFile?.["form-8959"]?.value,
    resolve8960Info(inputs).mustFile?.["form-8960"]?.value,
    resolveScheduleHInfo(inputs).mustFile?.["schedule-h"]?.value,
    resolve6251Info(inputs).mustFile?.["form-6251"]?.value,
    resolve8962Info(inputs).mustFile?.["form-8962"]?.value,
    // Form 8853 lines 9b and 13b (lines 17e and 17f).
    form8853Reaches(resolve8853Info(inputs), SCHEDULE_2_LINES),
    scheduleTwoNeededForEarlyDistributions(inputs),
    // A clean vehicle credit transferred to the dealer may be repaid on line 1b or 1c.
    cleanVehicleSchedules(inputs).repayment,
    // Form 8621 lines 16f, 23 and 24 (lines 17p, 17z and 17q).
    form8621Feeds(inputs).scheduleTwo,
  ];
  const required = feeders.some((value) => value === true);
  const open = !required && feeders.some((value) => value === undefined);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_2",
    fallbacks: open
      ? []
      : [
          {
            rule: "fallback: Schedule SE (line 4), Form 4137 (line 5), Form 8919 (line 6), Form 8959 (line 11), Form 8960 (line 12), Schedule H (line 9), Form 6251 (line 2), Form 8962 (line 1a), or an early distribution tax (line 8) is required, or Form 8853 has an additional tax (lines 17e and 17f), or a clean vehicle credit was transferred (lines 1b, 1c)",
            value: required,
          },
        ],
  });
  return {
    mustFile: { "schedule-2": resolution },
  };
}
