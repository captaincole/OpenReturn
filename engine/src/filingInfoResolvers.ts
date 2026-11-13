import {
  BLINDNESS_KEYS,
  CAPITAL_LOSS_CARRYOVER_KEYS,
  CA_MISC_DEDUCTION_KEYS,
  CA_PAYMENT_KEYS,
  NET_INVESTMENT_INCOME_KEYS,
  SPOUSE_KEYS,
  isDividendFactKey,
  isInterestFactKey,
  isW2FactKey,
} from "./facts/index.js";
import { resolve6251Info } from "./federal/6251/resolveInfo.js";
import { planForm8949Copies, totalsByBox } from "./federal/8949/copyPlan.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import { resolve8959Info } from "./federal/8959/resolveInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import { NIIT_THRESHOLDS, rentalsWithoutTradeOrBusinessAnswer } from "./federal/8960/lines.js";
import { investmentSignals, magiUpperBound } from "./federal/8960/mustFile.js";
import { resolve8962Info } from "./federal/8962/resolveInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import { resolveScheduleAInfo } from "./federal/schedule-a/resolveInfo.js";
import type { PayerAmount, ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import { resolveScheduleEInfo } from "./federal/schedule-e/resolveInfo.js";
import { resolveScheduleHInfo } from "./federal/schedule-h/resolveInfo.js";
import { resolveScheduleSEInfo } from "./federal/schedule-se/resolveInfo.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import { sum, sumOrBlank, type Money } from "./money.js";
import {
  factsInCategory,
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
import type { ScheduleCaFilingInfo } from "./state/ca/schedule-ca/filingInfo.js";
import { phone, ssn, type FilingStatus } from "./values.js";

export { resolveSchedule1Info } from "./federal/schedule-1/resolveInfo.js";
export { makeResolverInputs, type ResolverInputs } from "./resolverInputs.js";

const FILING_STATUSES: ReadonlySet<unknown> = new Set<FilingStatus>([
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
  "qualifying_surviving_spouse",
]);

export function filingStatusOf(inputs: ResolverInputs): FilingStatus | undefined {
  const raw = inputs.decisionByKey.get("decisions.scope.filing_status");
  return FILING_STATUSES.has(raw) ? (raw as FilingStatus) : undefined;
}

/* Born before January 2 of the given year: a January 1 birthday counts as the day before. */
function bornBeforeJan2Of(dob: string | undefined, cutoffYear: number): boolean | undefined {
  const us = dob?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = dob?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ymd = us ? [us[3], us[1], us[2]] : iso ? [iso[1], iso[2], iso[3]] : undefined;
  if (!ymd) return undefined;
  const [year, month, day] = ymd.map(Number);
  return year < cutoffYear || (year === cutoffYear && month === 1 && day < 2);
}

/*
 * 65 or older at the end of 2025 (1040 line 12d). CA 540 line 9 counts a
 * January 1, 1961 birthday as 65 on December 31. Tax year 2025 only.
 */
export function bornBeforeJan2_1961(dob: string | undefined): boolean | undefined {
  return bornBeforeJan2Of(dob, 1961);
}

/* 55 or older at the end of 2025: the HSA additional contribution (Form 8889 line 3). Tax year 2025 only. */
export function bornBeforeJan2_1971(dob: string | undefined): boolean | undefined {
  return bornBeforeJan2Of(dob, 1971);
}

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

export function hasW2(inputs: ResolverInputs): boolean {
  return factsInCategory(inputs, "wages").some((row) => isW2FactKey(row.key));
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
    w2CaSdiTotal: sumCaSdi(factsInCategory(inputs, "wages")) as Form540FilingInfo["w2CaSdiTotal"],
    useTaxOwed: useTaxOwed as Form540FilingInfo["useTaxOwed"],
    noUseTaxOwed:
      decisionByKey.get("decisions.scope.use_tax_zero_reason") === "no_use_tax_owed"
        ? true
        : undefined,
    useTaxZeroReason: typeof useTaxZeroReason === "string" ? useTaxZeroReason : undefined,
    mailingSameAsResidence: decisionByKey.get(
      "decisions.scope.mailing_same_as_principal_residence",
    ) as boolean | undefined,
    refundFullOverpaymentCA: decisionByKey.get("decisions.refund.refund_full_overpayment_ca") as
      boolean | undefined,
    ...blindnessAndCaPayments(inputs),
  };
}

/*
 * Line 8: who is visually impaired. Line 72: the California payments the taxpayer
 * states, blank when none is recorded.
 */
function blindnessAndCaPayments(
  inputs: ResolverInputs,
): Pick<Form540FilingInfo, "taxpayerBlind" | "spouseBlind" | "caEstimatedAndOtherPayments"> {
  return {
    taxpayerBlind: inputs.factByKey.get(BLINDNESS_KEYS.taxpayer) === true,
    spouseBlind: inputs.factByKey.get(BLINDNESS_KEYS.spouse) === true,
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
  return {
    mustFile: { "schedule-ca": resolution },
    /* A California itemizer states the fees once (Part II line 21); 0 is an answer. */
    missingInputs: {
      "schedule-ca":
        files540 && itemizes
          ? missingInputs({ [CA_MISC_DEDUCTION_KEYS.investmentFees]: caInvestmentFees })
          : [],
    },
    caInvestmentFees,
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
 * Also fires for capital-gain distributions without 8949, and for a capital loss
 * carried over from last year: Schedule D lines 6 and 14 take it
 * (irs-1040sd-inst-2025::sec::capital-loss-carryover-worksheet-lines-6-and-14::b02).
 */
export function resolveScheduleDInfo(inputs: ResolverInputs): ScheduleDFilingInfo {
  const carryoverKeys = Object.values(CAPITAL_LOSS_CARRYOVER_KEYS).filter(
    (key) => (num(inputs, key) ?? 0) > 0,
  );
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_d",
    fallbacks: [
      ...reportableSalesFallbacks(inputs),
      {
        rule: "fallback: a capital loss carryover from last year",
        value: carryoverKeys.length > 0,
        triggeredByFactKeys: carryoverKeys,
      },
    ],
  });
  const distributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  const positive = (value: number | undefined): Money | undefined =>
    value !== undefined && value > 0 ? (value as Money) : undefined;
  return {
    mustFile: { "schedule-d": resolution },
    capitalGainDistributions: positive(distributions),
    shortTermLossCarryover: positive(num(inputs, CAPITAL_LOSS_CARRYOVER_KEYS.shortTerm)),
    longTermLossCarryover: positive(num(inputs, CAPITAL_LOSS_CARRYOVER_KEYS.longTerm)),
  };
}

/*
 * irs-8960-inst-2025::sec::who-must-file::b01 and application-to-individuals::b01:
 * MAGI over the filing-status threshold, with investment income (investmentSignals).
 * MAGI is an upper bound from facts (magiUpperBound), so a missed 8960 needs income
 * with no facts; set decisions.scope.must_file_8960 for that case.
 */
export function resolve8960Info(inputs: ResolverInputs): Form8960FilingInfo {
  const status = filingStatusOf(inputs);
  const threshold = status ? NIIT_THRESHOLDS[status] : undefined;
  // With no filing status yet, count a spouse's income too, and test the lowest threshold.
  const joint = status === undefined || status === "married_filing_jointly";
  const { scheduleCNonpassive, hasInvestment } = investmentSignals(inputs, joint);
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
  const openRentals =
    resolution.value === true ? rentalsWithoutTradeOrBusinessAnswer(rentalProperties ?? []) : [];
  // Line 10 (…::sec::line-10-additional-modifications::b01): optional, recorded only when stated.
  const additionalModifications = num(inputs, NET_INVESTMENT_INCOME_KEYS.additionalModifications);
  return {
    mustFile: { "form-8960": resolution },
    missingInputs: {
      "form-8960": [
        ...(asked
          ? missingInputs({ "state_local_tax.allocable_to_investment_income": allocableTax })
          : []),
        ...openRentals,
      ],
    },
    scheduleCNonpassive,
    rentalProperties,
    stateLocalTaxAllocableToInvestmentIncome: allocableTax,
    additionalModifications,
  };
}

/*
 * Default: required when Schedule SE (line 4), Form 8959 (line 11), Form 8960
 * (line 12), Schedule H (line 9), Form 6251 (line 2) or Form 8962 (line 1a) is
 * filed. While none is filed and one is still undecided, Schedule 2 is undecided
 * too. KNOWN GAP: the resolver cannot see Form 6251 line 11 or Form 8962 line 29,
 * so a filed Form 6251 with no AMT, or a Form 8962 with no repayment, still files
 * Schedule 2 with 0 or blank lines.
 */
export function resolveSchedule2Info(inputs: ResolverInputs): Schedule2FilingInfo {
  const feeders = [
    resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value,
    resolve8959Info(inputs).mustFile?.["form-8959"]?.value,
    resolve8960Info(inputs).mustFile?.["form-8960"]?.value,
    resolveScheduleHInfo(inputs).mustFile?.["schedule-h"]?.value,
    resolve6251Info(inputs).mustFile?.["form-6251"]?.value,
    resolve8962Info(inputs).mustFile?.["form-8962"]?.value,
  ];
  const required = feeders.some((value) => value === true);
  const open = !required && feeders.some((value) => value === undefined);
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_2",
    fallbacks: open
      ? []
      : [
          {
            rule: "fallback: Schedule SE (line 4), Form 8959 (line 11), Form 8960 (line 12), Schedule H (line 9), Form 6251 (line 2), or Form 8962 (line 1a) is required",
            value: required,
          },
        ],
  });
  return {
    mustFile: { "schedule-2": resolution },
  };
}

// IRS Schedule B inst.: interest or dividends over $1,500, or a Part III "Yes".
export function resolveScheduleBInfo(inputs: ResolverInputs): ScheduleBFilingInfo {
  const interestPayers = payerAmounts(inputs, isInterestFactKey, (value) =>
    sum(value.box1, value.box3),
  );
  const dividendPayers = payerAmounts(inputs, isDividendFactKey, (value) => sum(value.box1a));
  const hasForeignFinancialAccount = boolDecision(
    inputs,
    "decisions.scope.has_foreign_financial_account",
  );
  const hasForeignTrust = boolDecision(inputs, "decisions.scope.has_foreign_trust");
  const partIII = {
    "decisions.scope.has_foreign_financial_account": hasForeignFinancialAccount,
    "decisions.scope.has_foreign_trust": hasForeignTrust,
  };
  const rounding = inputs.decisionByKey.get("decisions.rounding.schedule_b");
  const interest = sum(...interestPayers.map((interestPayer) => interestPayer.amount));
  const dividends = sum(...dividendPayers.map((dividendPayer) => dividendPayer.amount));
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_b",
    fallbacks: [
      {
        rule: `fallback: interest $${interest} or dividends $${dividends} > $1,500, or a Part III "Yes"`,
        value:
          interest > 1500 ||
          dividends > 1500 ||
          hasForeignFinancialAccount === true ||
          hasForeignTrust === true,
      },
    ],
  });
  return {
    mustFile: { "schedule-b": resolution },
    missingInputs: { "schedule-b": missingInputs(partIII) },
    interestPayers,
    rounding: rounding === "sum_rounded_rows" ? "sum_rounded_rows" : "round_total",
    dividendPayers,
    hasForeignFinancialAccount,
    hasForeignTrust,
  };
}

function payerAmounts(
  inputs: ResolverInputs,
  isKind: (key: string) => boolean,
  amountOf: (v: Record<string, unknown>) => number,
): PayerAmount[] {
  return factsInCategory(inputs, "investment_income")
    .filter((row) => isKind(row.key))
    .map((row) => {
      const value = row.value as Record<string, unknown>;
      return { payerName: String(value.payerName ?? ""), amount: amountOf(value) };
    })
    .filter((payer) => payer.amount !== 0);
}

function boolDecision(inputs: ResolverInputs, key: string): boolean | undefined {
  const value = inputs.decisionByKey.get(key);
  return typeof value === "boolean" ? value : undefined;
}
