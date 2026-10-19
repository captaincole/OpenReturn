/*
 * Per-form slot resolvers behind resolveFilingInfo (filingInfo.ts).
 *
 * Each resolve<Form>Info function reads raw facts + decisions through a
 * shared ResolverInputs view and produces that form's FilingInfo slots,
 * plus its mustFile[formId] entry. resolveFilingInfo merges the results
 * into the runtime intersection. Adding a form = add its resolver here
 * and list it there.
 */

import { SPOUSE_KEYS, isDividendFactKey, isInterestFactKey, isW2FactKey } from "./facts/index.js";
import { planForm8949Copies, totalsByBox } from "./federal/8949/copyPlan.js";
import type { Form8949FilingInfo } from "./federal/8949/filingInfo.js";
import type { Form8959FilingInfo } from "./federal/8959/filingInfo.js";
import type { Form8960FilingInfo } from "./federal/8960/filingInfo.js";
import type { Schedule1FilingInfo } from "./federal/schedule-1/filingInfo.js";
import type { Schedule2FilingInfo } from "./federal/schedule-2/filingInfo.js";
import type { ScheduleAFilingInfo } from "./federal/schedule-a/filingInfo.js";
import type { PayerAmount, ScheduleBFilingInfo } from "./federal/schedule-b/filingInfo.js";
import type { ScheduleDFilingInfo } from "./federal/schedule-d/filingInfo.js";
import { resolveScheduleHInfo } from "./federal/schedule-h/resolveInfo.js";
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

// ─── Per-form resolvers ──────────────────────────────────────────────────

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
 * Born before January 2, 1961: 65 or older at the end of 2025 (1040
 * line 12d; CA 540 line 9 counts a January 1, 1961 birthday as 65 on
 * December 31). Reads "MM/DD/YYYY" or "YYYY-MM-DD"; anything else is
 * unknown. Tax year 2025 only, like the rest of the engine's tables.
 */
export function bornBeforeJan2_1961(dob: string | undefined): boolean | undefined {
  const us = dob?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const iso = dob?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ymd = us ? [us[3], us[1], us[2]] : iso ? [iso[1], iso[2], iso[3]] : undefined;
  if (!ymd) return undefined;
  const [y, m, d] = ymd.map(Number);
  return y < 1961 || (y === 1961 && m === 1 && d < 2);
}

export function resolveBaseInfo(inputs: ResolverInputs): BaseFilingInfo {
  const filingStatus = filingStatusOf(inputs);
  const ssnRaw = text(inputs, "identity.ssn");
  const spouseSsnRaw = text(inputs, SPOUSE_KEYS.ssn);
  const phoneRaw = text(inputs, "identity.phone");
  const dob = text(inputs, "identity.dob");

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
    taxpayerDateOfBirth: dob,
    taxpayerBornBeforeJan2_1961: bornBeforeJan2_1961(dob),
    spouseFirstName: text(inputs, SPOUSE_KEYS.firstName),
    spouseMiddleInitial: text(inputs, SPOUSE_KEYS.middleInitial),
    spouseLastName: text(inputs, SPOUSE_KEYS.lastName),
    spouseSSN: spouseSsnRaw ? ssn(spouseSsnRaw) : undefined,
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
  const r = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_ca_540",
  });
  const useTaxOwed = num(inputs, "use_tax.owed_amount");
  const useTaxZeroReason = decisionByKey.get("decisions.scope.use_tax_zero_reason");
  return {
    mustFile: { "form-540": r },
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
    mustFile: { "schedule-ca": r },
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
    mustFile: { "form-8949": r },
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
    mustFile: { "schedule-d": r },
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
    mustFile: { "form-8959": r },
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
    mustFile: { "form-8960": r },
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
      ? sum(...misc.map((row) => (row.value as Record<string, unknown>).box3))
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
    mustFile: { "schedule-1": r },
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
  const form8959 = resolve8959Info(inputs).mustFile?.["form-8959"]?.value === true;
  const form8960 = resolve8960Info(inputs).mustFile?.["form-8960"]?.value === true;
  const scheduleH = resolveScheduleHInfo(inputs).mustFile?.["schedule-h"]?.value === true;
  const r = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_schedule_2",
    fallbacks: [
      {
        rule: "fallback: Form 8959 (line 11), Form 8960 (line 12), or Schedule H (line 9) is required",
        value: form8959 || form8960 || scheduleH,
      },
    ],
  });
  return {
    mustFile: { "schedule-2": r },
  };
}

/*
 * Default (IRS Schedule B instructions): required when taxable interest
 * or ordinary dividends exceed $1,500, or when either Part III question
 * is "Yes". An explicit `decisions.scope.must_file_schedule_b` wins.
 */
export function resolveScheduleBInfo(inputs: ResolverInputs): ScheduleBFilingInfo {
  const interestPayers = payerAmounts(inputs, isInterestFactKey, (v) => sum(v.box1, v.box3));
  const dividendPayers = payerAmounts(inputs, isDividendFactKey, (v) => sum(v.box1a));
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
  const interest = sum(...interestPayers.map((p) => p.amount));
  const dividends = sum(...dividendPayers.map((p) => p.amount));
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
    mustFile: { "schedule-b": r },
    /* Part III's yes/no questions are required on every filed Schedule B. */
    missingInputs: { "schedule-b": missingInputs(partIII) },
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
    mustFile: { "schedule-a": r },
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
