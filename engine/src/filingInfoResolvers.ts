import {
  SPOUSE_KEYS,
  businessesOnReturn,
  getGamblingWinningsFacts,
  isDividendFactKey,
  isInterestFactKey,
  isMiscIncomeFactKey,
  isW2FactKey,
} from "./facts/index.js";
import { resolve8889Info } from "./federal/8889/resolveInfo.js";
import { planForm8949Copies, totalsByBox } from "./federal/8949/copyPlan.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import { resolve8959Info } from "./federal/8959/resolveInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import { NIIT_THRESHOLDS } from "./federal/8960/lines.js";
import { investmentSignals, magiUpperBound } from "./federal/8960/mustFile.js";
import type { Schedule1FilingInfo } from "./federal/schedule-1/filingInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { PayerAmount, ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import { netProfit } from "./federal/schedule-c/lines.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import { resolveScheduleHInfo } from "./federal/schedule-h/resolveInfo.js";
import { resolveScheduleSEInfo } from "./federal/schedule-se/resolveInfo.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import { sum } from "./money.js";
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

/*
 * 65 or older at the end of 2025 (1040 line 12d). CA 540 line 9 counts a
 * January 1, 1961 birthday as 65 on December 31. Tax year 2025 only.
 */
export function bornBeforeJan2_1961(dob: string | undefined): boolean | undefined {
  const us = dob?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = dob?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ymd = us ? [us[3], us[1], us[2]] : iso ? [iso[1], iso[2], iso[3]] : undefined;
  if (!ymd) return undefined;
  const [year, month, day] = ymd.map(Number);
  return year < 1961 || (year === 1961 && month === 1 && day < 2);
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
      }),
    },
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
  };
}

// Default: file with Form 540. Set the explicit decision false to opt out.
export function resolveScheduleCaInfo(inputs: ResolverInputs): ScheduleCaFilingInfo {
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_ca",
    fallbacks: [
      {
        rule: "fallback: must_file_ca_540 = true",
        value: inputs.decisionByKey.get("decisions.scope.must_file_ca_540") === true,
        triggeredByDecisionKeys: ["decisions.scope.must_file_ca_540"],
      },
    ],
  });
  return {
    mustFile: { "schedule-ca": resolution },
  };
}

export function resolve8949Info(inputs: ResolverInputs): Form8949FilingInfo {
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8949",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  return {
    mustFile: { "form-8949": resolution },
    shortTermTrades: inputs.trades.short,
    longTermTrades: inputs.trades.long,
    form8949Copies: planForm8949Copies(inputs.trades.boxed),
    form8949BoxTotals: totalsByBox(inputs.trades.boxed),
  };
}

// Also fires for capital-gain distributions without 8949.
export function resolveScheduleDInfo(inputs: ResolverInputs): ScheduleDFilingInfo {
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_d",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  const distributions = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  return {
    mustFile: { "schedule-d": resolution },
    capitalGainDistributions:
      distributions > 0
        ? (distributions as ScheduleDFilingInfo["capitalGainDistributions"])
        : undefined,
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
  return {
    mustFile: { "form-8960": resolution },
    scheduleCNonpassive,
  };
}

export function resolveSchedule1Info(inputs: ResolverInputs): Schedule1FilingInfo {
  const misc = factsInCategory(inputs, "other").filter((row) => isMiscIncomeFactKey(row.key));
  const miscOtherIncome =
    misc.length > 0
      ? sum(...misc.map((row) => (row.value as Record<string, unknown>).box3))
      : undefined;
  // Form 8889 lines 13 and 16 reach the 1040 only through Schedule 1.
  const form8889 = resolve8889Info(inputs).mustFile?.["form-8889"]?.value === true;
  const onReturn = businessesOnReturn(
    inputs.facts,
    filingStatusOf(inputs) === "married_filing_jointly",
  );
  const hasBusiness =
    onReturn.businesses.length + onReturn.spouseKeys.length + onReturn.malformedKeys.length > 0;
  const businessIncome = scheduleCTotal(onReturn);
  const w2gs = getGamblingWinningsFacts(inputs.facts);
  const gamblingWinnings = w2gs.length > 0 ? sum(...w2gs.map((w2g) => w2g.box1)) : undefined;
  // Schedule SE line 13 reaches the 1040 only through Schedule 1 line 15.
  const scheduleSE = resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_1",
    fallbacks: [
      {
        rule: `fallback: 1099-MISC other income $${miscOtherIncome ?? 0} > 0, W-2G winnings $${gamblingWinnings ?? 0} > 0, a Schedule C business (${hasBusiness}), Schedule SE filed (${scheduleSE}), or Form 8889 filed (${form8889})`,
        value:
          (miscOtherIncome ?? 0) > 0 ||
          (gamblingWinnings ?? 0) > 0 ||
          hasBusiness ||
          scheduleSE ||
          form8889,
      },
    ],
  });
  return {
    mustFile: { "schedule-1": resolution },
    businessIncome,
    gamblingWinnings,
    miscOtherIncome,
  };
}

/*
 * Schedule 1 line 3: line 31 of every Schedule C on this return, both spouses'
 * on a joint return. One blank line 31, or a business fact that cannot be read,
 * leaves the total blank. On any other status a spouse's business belongs on the
 * spouse's return, but under community property part of it may belong here
 * (Form 8958, not modeled), so a spouse's business also leaves line 3 blank.
 */
function scheduleCTotal({
  businesses,
  spouseKeys,
  malformedKeys,
}: ReturnType<typeof businessesOnReturn>): number | undefined {
  if (businesses.length === 0 || spouseKeys.length > 0 || malformedKeys.length > 0) {
    return undefined;
  }
  const profits = businesses.map((business) => netProfit(business.value));
  return profits.every((profit) => profit !== undefined) ? sum(...profits) : undefined;
}

// Default: required when Schedule SE (line 4), Form 8959 (line 11), Form 8960 (line 12) or Schedule H (line 9) is filed.
export function resolveSchedule2Info(inputs: ResolverInputs): Schedule2FilingInfo {
  const scheduleSE = resolveScheduleSEInfo(inputs).mustFile?.["schedule-se"]?.value === true;
  const form8959 = resolve8959Info(inputs).mustFile?.["form-8959"]?.value === true;
  const form8960 = resolve8960Info(inputs).mustFile?.["form-8960"]?.value === true;
  const scheduleH = resolveScheduleHInfo(inputs).mustFile?.["schedule-h"]?.value === true;
  const resolution = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_2",
    fallbacks: [
      {
        rule: "fallback: Schedule SE (line 4), Form 8959 (line 11), Form 8960 (line 12), or Schedule H (line 9) is required",
        value: scheduleSE || form8959 || form8960 || scheduleH,
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

export function resolveScheduleAInfo(inputs: ResolverInputs): ScheduleAFilingInfo {
  const { decisionByKey } = inputs;
  const resolution = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_a",
    fallbacks: [
      {
        rule: "fallback: decisions.itemize_vs_standard = itemized",
        value: decisionByKey.get("decisions.itemize_vs_standard") === "itemized",
        triggeredByDecisionKeys: ["decisions.itemize_vs_standard"],
      },
    ],
  });
  const w2Box17 = sumW2Box(inputs, "box17");
  const caSdi = sumCaSdi(factsInCategory(inputs, "wages"));
  const estStateTax = num(inputs, "state_local_tax.estimated_payments");
  return {
    mustFile: { "schedule-a": resolution },
    medicalDentalExpenses: num(inputs, "medical.expenses_total"),
    stateLocalIncomeTaxPaid: w2Box17 + caSdi + (estStateTax ?? 0),
    generalSalesTaxElection: decisionByKey.get("decisions.itemized.elect_general_sales_tax") as
      boolean | undefined,
    realEstateTaxes: num(inputs, "state_local_tax.real_estate"),
    personalPropertyTaxes: num(inputs, "state_local_tax.personal_property"),
    mortgageInterestForm1098: num(inputs, "mortgage.interest_form_1098"),
    mortgageInterestNotForm1098: num(inputs, "mortgage.interest_not_form_1098"),
    pointsNotForm1098: num(inputs, "mortgage.points_not_form_1098"),
    investmentInterest: num(inputs, "investment_income.investment_interest_expense"),
    giftsCashCheck: num(inputs, "charitable.cash"),
    giftsOtherThanCash: num(inputs, "charitable.noncash"),
    giftsCarryover: num(inputs, "charitable.carryover"),
  };
}
