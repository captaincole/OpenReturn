/*
 * Per-form slot resolvers behind resolveFilingInfo (filingInfo.ts).
 *
 * Each resolve<Form>Info function reads raw facts + decisions through a
 * shared ResolverInputs view and produces that form's FilingInfo slots.
 * resolveFilingInfo spreads the results into the runtime intersection.
 * Adding a form = add its resolver here and spread it there.
 */

import {
  isDividendFactKey,
  isInterestFactKey,
  type RetirementDistributionFactValue,
} from "./facts/index.js";
import type { Form1040FilingInfo, RetirementLine } from "./federal/1040/filingInfo.js";
import { planForm8949Copies, totalsByBox } from "./federal/8949/copyPlan.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import type { Schedule1FilingInfo } from "./federal/schedule-1/filingInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { PayerAmount, ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import type { BaseFilingInfo } from "./filingInfo.js";
import {
  factsInCategory,
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
import { phone, ssn } from "./values.js";

export { makeResolverInputs, type ResolverInputs } from "./resolverInputs.js";

// ─── Per-form resolvers ──────────────────────────────────────────────────

export function resolveBaseInfo(inputs: ResolverInputs): BaseFilingInfo {
  const filingStatusRaw = inputs.decisionByKey.get("decisions.scope.filing_status");
  const filingStatus =
    filingStatusRaw === "single" ||
    filingStatusRaw === "married_filing_jointly" ||
    filingStatusRaw === "married_filing_separately" ||
    filingStatusRaw === "head_of_household" ||
    filingStatusRaw === "qualifying_surviving_spouse"
      ? filingStatusRaw
      : undefined;

  const ssnRaw = text(inputs, "identity.ssn");
  const phoneRaw = text(inputs, "identity.phone");

  return {
    filingStatus,
    taxpayerFirstName: text(inputs, "identity.name.first"),
    taxpayerMiddleInitial: text(inputs, "identity.name.middle_initial"),
    taxpayerLastName: text(inputs, "identity.name.last"),
    /*
     * The constructors strip separators and validate the digit count.
     * The FilingInfo slot stores bare digits.
     */
    taxpayerSSN: ssnRaw ? ssn(ssnRaw) : undefined,
    taxpayerDateOfBirth: text(inputs, "identity.dob"),
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

/*
 * 1099-INT sums: box1 (taxable) and box8 (tax-exempt). The filter pins
 * each aggregate to its source section, because future 1099 sections
 * (OID, MISC) may reuse low-number box names. When the taxpayer has NO
 * interest facts at all, the slots stay undefined rather than 0. The
 * renderer then leaves the cells blank instead of writing "0", which
 * matches the CPA-golden convention.
 */
function resolveInterestSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const hasInterest = inputs.facts.some(
    (f) => f.category === "investment_income" && isInterestFactKey(f.key),
  );
  if (!hasInterest) {
    return { taxableInterestTotal: undefined, taxExemptInterestTotal: undefined };
  }
  return {
    // Box 3 (US savings bond and Treasury interest) is taxable federally, as on Schedule B line 1.
    taxableInterestTotal: (sumInvestmentBox(inputs, "box1", isInterestFactKey) +
      sumInvestmentBox(
        inputs,
        "box3",
        isInterestFactKey,
      )) as Form1040FilingInfo["taxableInterestTotal"],
    taxExemptInterestTotal: sumInvestmentBox(
      inputs,
      "box8",
      isInterestFactKey,
    ) as Form1040FilingInfo["taxExemptInterestTotal"],
  };
}

/*
 * 1099-R facts (category "retirement") → 1040 lines 4a–4c (IRA box
 * checked) and 5a–5c (everything else). Gross = box 1, taxable = box 2a.
 * Codes G and H are direct rollovers. No 1099-R facts: both stay blank.
 */
function resolveRetirementSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const rows = factsInCategory(inputs, "retirement")
    .filter((row) => /^payer\.[^.]+\.distributions\.[^.]+$/.test(row.key))
    .map((row) => row.value as RetirementDistributionFactValue);
  const line = (ira: boolean): RetirementLine | undefined => {
    const group = rows.filter((r) => r.box7IraSepSimple === ira);
    if (group.length === 0) return undefined;
    const undetermined = group.some(
      (r) => r.box2a === undefined && r.box2b?.taxableAmountNotDetermined === true,
    );
    return {
      gross: group.reduce((t, r) => t + r.box1, 0),
      taxable: undetermined ? undefined : group.reduce((t, r) => t + (r.box2a ?? r.box1), 0),
      rollover: group.some((r) => /[GH]/.test(r.box7)),
    };
  };
  return { iraDistributions: line(true), pensionDistributions: line(false) };
}

export function resolve1040Info(inputs: ResolverInputs): Form1040FilingInfo {
  const { decisionByKey } = inputs;
  const mustFile = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_federal",
  });
  const itemizeDecision = decisionByKey.get("decisions.itemize_vs_standard");
  return {
    mustFileFederal: mustFile.value as Form1040FilingInfo["mustFileFederal"],
    mustFileFederalDerivation: mustFile.derivation,
    hasDigitalAssets: decisionByKey.get("decisions.scope.has_digital_assets") as
      boolean | undefined,
    w2WagesTotal: sumW2Box(inputs, "box1") as Form1040FilingInfo["w2WagesTotal"],
    w2FederalWithholding: sumW2Box(inputs, "box2") as Form1040FilingInfo["w2FederalWithholding"],
    qualifiedDividends: sumInvestmentBox(
      inputs,
      "box1b",
    ) as Form1040FilingInfo["qualifiedDividends"],
    ordinaryDividends: sumInvestmentBox(inputs, "box1a") as Form1040FilingInfo["ordinaryDividends"],
    form1099FederalWithholding: sumInvestmentBox(
      inputs,
      "box4",
    ) as Form1040FilingInfo["form1099FederalWithholding"],
    ...resolveInterestSlots(inputs),
    ...resolveRetirementSlots(inputs),
    refundFullOverpaymentFederal: decisionByKey.get(
      "decisions.refund.refund_full_overpayment_federal",
    ) as boolean | undefined,
    useItemizedDeductions:
      itemizeDecision === "itemized" ? true : itemizeDecision === "standard" ? false : undefined,
  };
}

export function resolve540Info(inputs: ResolverInputs): Form540FilingInfo {
  const { decisionByKey, factByKey } = inputs;
  const mustFile = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_ca_540",
  });
  return {
    mustFileCA540: mustFile.value as Form540FilingInfo["mustFileCA540"],
    mustFileCA540Derivation: mustFile.derivation,
    caResidencyStatus: decisionByKey.get("decisions.scope.ca_residency") as string | undefined,
    w2StateWages: sumW2Box(inputs, "box16") as Form540FilingInfo["w2StateWages"],
    w2StateWithholding: sumW2Box(inputs, "box17") as Form540FilingInfo["w2StateWithholding"],
    w2CaSdiTotal: sumCaSdi(factsInCategory(inputs, "wages")) as Form540FilingInfo["w2CaSdiTotal"],
    useTaxOwed:
      typeof factByKey.get("use_tax.owed_amount") === "number"
        ? (factByKey.get("use_tax.owed_amount") as Form540FilingInfo["useTaxOwed"])
        : undefined,
    noUseTaxOwed:
      decisionByKey.get("decisions.scope.use_tax_zero_reason") === "no_use_tax_owed"
        ? true
        : undefined,
    useTaxZeroReason: (() => {
      const v = decisionByKey.get("decisions.scope.use_tax_zero_reason");
      return typeof v === "string" ? v : undefined;
    })(),
    mailingSameAsResidence: decisionByKey.get(
      "decisions.scope.mailing_same_as_principal_residence",
    ) as boolean | undefined,
    refundFullOverpaymentCA: decisionByKey.get("decisions.refund.refund_full_overpayment_ca") as
      boolean | undefined,
  };
}

/*
 * Default: file Schedule CA whenever Form 540 is filed. An explicit
 * `decisions.scope.must_file_schedule_ca` overrides the default. Set it
 * false on scenarios that do not need the schedule (for example Alex: no
 * adjustments to report).
 */
export function resolveScheduleCaInfo(inputs: ResolverInputs): ScheduleCaFilingInfo {
  const r = resolveMustFile(inputs.decisionByKey, {
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
    mustFileScheduleCA: r.value as ScheduleCaFilingInfo["mustFileScheduleCA"],
    mustFileScheduleCADerivation: r.derivation,
  };
}

/*
 * Default: required when trade facts exist to itemize, OR when the 1099
 * ingest recorded `has_reportable_sales = true`. Either signal indicates
 * capital-asset sales that need row-level reporting.
 */
export function resolve8949Info(inputs: ResolverInputs): Form8949FilingInfo {
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8949",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  return {
    mustFile8949: r.value as Form8949FilingInfo["mustFile8949"],
    mustFile8949Derivation: r.derivation,
    shortTermTrades: inputs.trades.short,
    longTermTrades: inputs.trades.long,
    form8949Copies: planForm8949Copies(inputs.trades.boxed),
    form8949BoxTotals: totalsByBox(inputs.trades.boxed),
  };
}

/*
 * Default: required whenever Form 8949 is required, because Schedule D
 * summarizes the per-row 8949 totals. It also fires for capital-gain
 * distributions without 8949. The same trade-fact / decision signals
 * cover both cases.
 */
export function resolveScheduleDInfo(inputs: ResolverInputs): ScheduleDFilingInfo {
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_d",
    fallbacks: reportableSalesFallbacks(inputs),
  });
  return {
    mustFileScheduleD: r.value as ScheduleDFilingInfo["mustFileScheduleD"],
    mustFileScheduleDDerivation: r.derivation,
  };
}

/*
 * Default: required when Medicare wages exceed $200,000. That is the
 * single-filer threshold, which the IRS also uses as the
 * employer-withholding cut-line. Other statuses have different
 * thresholds, but this conservative fallback catches every case where
 * the form COULD be required. An explicit `decisions.scope.must_file_8959`
 * wins when set.
 */
export function resolve8959Info(inputs: ResolverInputs): Form8959FilingInfo {
  const medicareWages = sumW2Box(inputs, "box5");
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8959",
    fallbacks: [
      {
        rule: `fallback: W-2 box 5 (Medicare wages) sum $${medicareWages} > $200,000`,
        value: medicareWages > 200000,
      },
    ],
  });
  return {
    mustFile8959: r.value as Form8959FilingInfo["mustFile8959"],
    mustFile8959Derivation: r.derivation,
    w2MedicareWagesTotal: medicareWages as Form8959FilingInfo["w2MedicareWagesTotal"],
    w2MedicareTaxWithheld: sumW2Box(inputs, "box6") as Form8959FilingInfo["w2MedicareTaxWithheld"],
  };
}

/*
 * Default: required when the taxpayer has investment income and W-2
 * wages + taxable interest + ordinary dividends exceed $200,000 (the
 * single threshold, as conservative as the 8959 fallback). It misses a
 * taxpayer whose MAGI crosses the line only through capital gains; set
 * `decisions.scope.must_file_8960` explicitly then. The explicit
 * decision wins when set.
 */
export function resolve8960Info(inputs: ResolverInputs): Form8960FilingInfo {
  const hasInvestment = inputs.facts.some((f) => f.category === "investment_income");
  const income =
    sumW2Box(inputs, "box1") +
    sumInvestmentBox(inputs, "box1", isInterestFactKey) +
    sumInvestmentBox(inputs, "box1a", isDividendFactKey);
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8960",
    fallbacks: [
      {
        rule: `fallback: investment income present and wages + interest + dividends $${income} > $200,000`,
        value: hasInvestment && income > 200000,
      },
    ],
  });
  return {
    mustFile8960: r.value as Form8960FilingInfo["mustFile8960"],
    mustFile8960Derivation: r.derivation,
  };
}

/*
 * Default: required when there is other income (1099-MISC box 3, line
 * 8z). An explicit `decisions.scope.must_file_schedule_1` wins.
 */
export function resolveSchedule1Info(inputs: ResolverInputs): Schedule1FilingInfo {
  const misc = factsInCategory(inputs, "other").filter((row) =>
    /^account\.[^.]+\.misc$/.test(row.key),
  );
  const miscOtherIncome =
    misc.length > 0
      ? misc.reduce((t, row) => t + num0((row.value as Record<string, unknown>).box3), 0)
      : undefined;
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_1",
    fallbacks: [
      {
        rule: `fallback: 1099-MISC other income $${miscOtherIncome ?? 0} > 0`,
        value: (miscOtherIncome ?? 0) > 0,
      },
    ],
  });
  return {
    mustFileSchedule1: r.value as Schedule1FilingInfo["mustFileSchedule1"],
    mustFileSchedule1Derivation: r.derivation,
    miscOtherIncome,
  };
}

/*
 * Default: required when a form that feeds it is required: Form 8959
 * (line 11) or Form 8960 (line 12). Form 8889 (lines 17c/17d) joins when
 * it gets a must-file rule. An explicit
 * `decisions.scope.must_file_schedule_2` wins when set.
 */
export function resolveSchedule2Info(inputs: ResolverInputs): Schedule2FilingInfo {
  const form8959 = resolve8959Info(inputs).mustFile8959 === true;
  const form8960 = resolve8960Info(inputs).mustFile8960 === true;
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_2",
    fallbacks: [
      {
        rule: "fallback: Form 8959 (line 11) or Form 8960 (line 12) is required",
        value: form8959 || form8960,
      },
    ],
  });
  return {
    mustFileSchedule2: r.value as Schedule2FilingInfo["mustFileSchedule2"],
    mustFileSchedule2Derivation: r.derivation,
  };
}

/*
 * Default (IRS Schedule B instructions): required when taxable interest
 * or ordinary dividends exceed $1,500, or when either Part III question
 * is "Yes". An explicit `decisions.scope.must_file_schedule_b` wins.
 */
export function resolveScheduleBInfo(inputs: ResolverInputs): ScheduleBFilingInfo {
  const interestPayers = payerAmounts(
    inputs,
    isInterestFactKey,
    (v) => num0(v.box1) + num0(v.box3),
  );
  const dividendPayers = payerAmounts(inputs, isDividendFactKey, (v) => num0(v.box1a));
  const hasForeignFinancialAccount = boolDecision(
    inputs,
    "decisions.scope.has_foreign_financial_account",
  );
  const hasForeignTrust = boolDecision(inputs, "decisions.scope.has_foreign_trust");
  const rounding = inputs.decisionByKey.get("decisions.rounding.schedule_b");
  const interest = interestPayers.reduce((t, p) => t + p.amount, 0);
  const dividends = dividendPayers.reduce((t, p) => t + p.amount, 0);
  const r = resolveMustFile(inputs.decisionByKey, {
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
    mustFileScheduleB: r.value as ScheduleBFilingInfo["mustFileScheduleB"],
    mustFileScheduleBDerivation: r.derivation,
    interestPayers,
    rounding: rounding === "sum_rounded_rows" ? "sum_rounded_rows" : "round_total",
    dividendPayers,
    hasForeignFinancialAccount,
    hasForeignTrust,
  };
}

/* One row per 1099 fact of the given kind, in fact order; zero amounts are skipped. */
function payerAmounts(
  inputs: ResolverInputs,
  isKind: (key: string) => boolean,
  amountOf: (v: Record<string, unknown>) => number,
): PayerAmount[] {
  return factsInCategory(inputs, "investment_income")
    .filter((row) => isKind(row.key))
    .map((row) => {
      const v = row.value as Record<string, unknown>;
      return { payerName: String(v.payerName ?? ""), amount: amountOf(v) };
    })
    .filter((p) => p.amount !== 0);
}

function num0(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function boolDecision(inputs: ResolverInputs, key: string): boolean | undefined {
  const v = inputs.decisionByKey.get(key);
  return typeof v === "boolean" ? v : undefined;
}

/*
 * Default: required when decisions.itemize_vs_standard chose itemized.
 * An explicit `decisions.scope.must_file_schedule_a` wins when set.
 * State-local income tax composes from existing W-2 sums (box 17 + CA
 * SDI); the other slots are single-fact reads.
 */
export function resolveScheduleAInfo(inputs: ResolverInputs): ScheduleAFilingInfo {
  const { decisionByKey } = inputs;
  const r = resolveMustFile(decisionByKey, {
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
    mustFileScheduleA: r.value as ScheduleAFilingInfo["mustFileScheduleA"],
    mustFileScheduleADerivation: r.derivation,
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
