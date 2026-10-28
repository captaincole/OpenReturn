import {
  SPOUSE_KEYS,
  isDividendFactKey,
  isInterestFactKey,
  isSocialSecurityFactKey,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
} from "../../facts/index.js";
import {
  filingStatusOf,
  hasW2,
  resolveScheduleAInfo,
  resolveScheduleDInfo,
} from "../../filingInfoResolvers.js";
import { sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  sumInvestmentBox,
  sumW2Box,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import type { Form1040FilingInfo, RetirementLine } from "./filingInfo.js";

/*
 * The filter pins each box to 1099-INT: other 1099 sections may reuse low
 * box names. No interest facts: undefined, so the cells stay blank, not "0".
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
 * A Roth IRA is an IRA (1040 inst., lines 4a/4b), but the payer leaves box 7
 * IRA/SEP/SIMPLE blank for one (1099-R inst.). Codes J, Q, T mark it.
 */
const ROTH_IRA_CODES = /[JQT]/;

/*
 * Code Q is not taxable. Codes J and T take the taxable part from Form 8606
 * Part III, which is not modeled, so box 2a is not used.
 */
export function rowTaxable(r: RetirementDistributionFactValue): number | undefined {
  if (r.box7.includes("Q")) return 0;
  if (/[JT]/.test(r.box7)) return undefined;
  if (r.box2a === undefined && r.box2b?.taxableAmountNotDetermined === true) return undefined;
  return r.box2a ?? r.box1;
}

function retirementRows(inputs: ResolverInputs): RetirementDistributionFactValue[] {
  return factsInCategory(inputs, "retirement")
    .filter((row) => /^payer\.[^.]+\.distributions\.[^.]+$/.test(row.key))
    .map((row) => row.value as RetirementDistributionFactValue);
}

function resolveRetirementSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const rows = retirementRows(inputs);
  const isIra = (r: RetirementDistributionFactValue) =>
    r.box7IraSepSimple || ROTH_IRA_CODES.test(r.box7);
  const line = (ira: boolean): RetirementLine | undefined => {
    const group = rows.filter((r) => isIra(r) === ira);
    if (group.length === 0) return undefined;
    const taxable = group.map(rowTaxable);
    return {
      gross: sum(...group.map((r) => r.box1)),
      taxable: taxable.includes(undefined) ? undefined : sum(...taxable),
      rollover: group.some((r) => /[GH]/.test(r.box7)),
    };
  };
  return { iraDistributions: line(true), pensionDistributions: line(false) };
}

function socialSecurityRows(inputs: ResolverInputs): SocialSecurityFactValue[] {
  return factsInCategory(inputs, "retirement")
    .filter((row) => isSocialSecurityFactKey(row.key))
    .map((row) => row.value as SocialSecurityFactValue);
}

function form1099Withholding(
  inputs: ResolverInputs,
): Form1040FilingInfo["form1099FederalWithholding"] {
  const total = sum(
    sumInvestmentBox(inputs, "box4"),
    ...retirementRows(inputs).map((r) => r.box4),
    ...socialSecurityRows(inputs).map((r) => r.box6),
  );
  return total > 0 ? (total as Form1040FilingInfo["form1099FederalWithholding"]) : undefined;
}

/* 1040 inst. line 7a, Exception 1: without Schedule D, 1099-DIV box 2a goes to line 7a. */
function capitalGainDistributionsNoScheduleD(
  inputs: ResolverInputs,
): Form1040FilingInfo["capitalGainDistributionsNoScheduleD"] {
  if (resolveScheduleDInfo(inputs).mustFile?.["schedule-d"]?.value !== false) return undefined;
  const total = sumInvestmentBox(inputs, "box2a", isDividendFactKey);
  return total > 0
    ? (total as Form1040FilingInfo["capitalGainDistributionsNoScheduleD"])
    : undefined;
}

export function resolve1040Info(inputs: ResolverInputs): Form1040FilingInfo {
  const { decisionByKey, factByKey } = inputs;
  const r = resolveMustFile(decisionByKey, {
    explicitKey: "decisions.scope.must_file_federal",
  });
  const filingStatus = filingStatusOf(inputs);
  const itemizeDecision = decisionByKey.get("decisions.itemize_vs_standard");
  const useItemizedDeductions =
    itemizeDecision === "itemized" ? true : itemizeDecision === "standard" ? false : undefined;
  const hasDigitalAssets = decisionByKey.get("decisions.scope.has_digital_assets") as
    boolean | undefined;
  const refundFullOverpaymentFederal = decisionByKey.get(
    "decisions.refund.refund_full_overpayment_federal",
  ) as boolean | undefined;
  const filesScheduleA = resolveScheduleAInfo(inputs).mustFile?.["schedule-a"]?.value === true;
  const ss = socialSecurityRows(inputs);
  const married =
    filingStatus === "married_filing_separately" || filingStatus === "married_filing_jointly";
  const livedApart = factByKey.get(SPOUSE_KEYS.livedApartAllYear) as boolean | undefined;
  const spouseItemizes = factByKey.get(SPOUSE_KEYS.itemizesSeparately) as boolean | undefined;
  return {
    mustFile: { "form-1040": r },
    missingInputs: {
      "form-1040": missingInputs({
        "decisions.scope.filing_status": filingStatus,
        "decisions.scope.has_digital_assets": hasDigitalAssets,
        "decisions.refund.refund_full_overpayment_federal": refundFullOverpaymentFederal,
        // Line 12d: born before January 2, 1961 raises the standard deduction.
        "identity.dob": text(inputs, "identity.dob"),
        ...(filesScheduleA ? { "decisions.itemize_vs_standard": useItemizedDeductions } : {}),
        ...(married
          ? {
              [SPOUSE_KEYS.firstName]: text(inputs, SPOUSE_KEYS.firstName),
              [SPOUSE_KEYS.lastName]: text(inputs, SPOUSE_KEYS.lastName),
              [SPOUSE_KEYS.ssn]: text(inputs, SPOUSE_KEYS.ssn),
            }
          : {}),
        // Line 12b: an MFS spouse who itemizes makes the standard deduction zero.
        ...(filingStatus === "married_filing_separately"
          ? { [SPOUSE_KEYS.itemizesSeparately]: spouseItemizes }
          : {}),
        // Line 6b: the worksheet base for MFS depends on living apart all year.
        ...(filingStatus === "married_filing_separately" && ss.length > 0
          ? { [SPOUSE_KEYS.livedApartAllYear]: livedApart }
          : {}),
      }),
    },
    hasDigitalAssets,
    w2WagesTotal: hasW2(inputs)
      ? (sumW2Box(inputs, "box1") as Form1040FilingInfo["w2WagesTotal"])
      : undefined,
    w2FederalWithholding: hasW2(inputs)
      ? (sumW2Box(inputs, "box2") as Form1040FilingInfo["w2FederalWithholding"])
      : undefined,
    qualifiedDividends: sumInvestmentBox(
      inputs,
      "box1b",
    ) as Form1040FilingInfo["qualifiedDividends"],
    ordinaryDividends: sumInvestmentBox(inputs, "box1a") as Form1040FilingInfo["ordinaryDividends"],
    form1099FederalWithholding: form1099Withholding(inputs),
    capitalGainDistributionsNoScheduleD: capitalGainDistributionsNoScheduleD(inputs),
    ...resolveInterestSlots(inputs),
    ...resolveRetirementSlots(inputs),
    socialSecurityBenefits:
      ss.length > 0
        ? (sum(...ss.map((s) => s.box5)) as Form1040FilingInfo["socialSecurityBenefits"])
        : undefined,
    livedApartFromSpouseAllYear: livedApart,
    spouseItemizesSeparately: spouseItemizes,
    refundFullOverpaymentFederal,
    useItemizedDeductions,
  };
}
