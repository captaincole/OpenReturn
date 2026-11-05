import {
  ROTH_IRA_CODES,
  SPOUSE_KEYS,
  hasDistributionCode,
  isDividendFactKey,
  isInterestFactKey,
  isRetirementDistributionFactKey,
  isSocialSecurityFactKey,
  makeTraditionalIraFactKey,
  type IraOwner,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
  type TraditionalIraFactValue,
} from "../../facts/index.js";
import {
  filingStatusOf,
  hasW2,
  resolveScheduleAInfo,
  resolveScheduleDInfo,
} from "../../filingInfoResolvers.js";
import { atLeast, sum } from "../../money.js";
import {
  factsInCategory,
  missingInputs,
  resolveMustFile,
  sumInvestmentBox,
  sumW2Box,
  text,
  type ResolverInputs,
} from "../../resolverInputs.js";
import { form8606Filers } from "../8606/resolveInfo.js";
import type { Form1040FilingInfo, IraLine } from "./filingInfo.js";

const OWNERS: IraOwner[] = ["taxpayer", "spouse"];

/*
 * The filter pins each box to 1099-INT: other 1099 sections may reuse low
 * box names. No interest facts: undefined, so the cells stay blank, not "0".
 */
function resolveInterestSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const hasInterest = inputs.facts.some(
    (fact) => fact.category === "investment_income" && isInterestFactKey(fact.key),
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

/* A Roth IRA is an IRA (1040 inst., lines 4a/4b), so ROTH_IRA_CODES rows go on line 4. */
const isRothIra = (row: RetirementDistributionFactValue) =>
  hasDistributionCode(row, ROTH_IRA_CODES);
const ROLLOVER_CODES = ["G", "H"];

/*
 * Code Q is not taxable. Codes J and T take the taxable part from Form 8606
 * Part III, which is not modeled, so box 2a is not used.
 */
export function rowTaxable(distribution: RetirementDistributionFactValue): number | undefined {
  if (distribution.box7.includes("Q")) return 0;
  if (hasDistributionCode(distribution, ["J", "T"])) return undefined;
  if (distribution.box2a === undefined && distribution.box2b?.taxableAmountNotDetermined === true)
    return undefined;
  return distribution.box2a ?? distribution.box1;
}

function retirementRows(inputs: ResolverInputs): RetirementDistributionFactValue[] {
  return factsInCategory(inputs, "retirement")
    .filter((row) => isRetirementDistributionFactKey(row.key))
    .map((row) => row.value as RetirementDistributionFactValue);
}

/*
 * Exception 1: the part rolled over is not taxable. A code G row already shows
 * 0 in box 2a (1099-R inst.), so only the rollover beyond its box 1 comes off
 * the other rows. `rolledOver` counts direct rollovers, as Form 8606 line 7 does.
 */
export function traditionalTaxable(
  rows: RetirementDistributionFactValue[],
  rolledOver: number,
): number | undefined {
  const isDirect = (row: RetirementDistributionFactValue) => row.box7.includes("G");
  const direct = rows.filter(isDirect);
  const others = rows.filter((row) => !isDirect(row));
  const directTaxable = direct.map(rowTaxable);
  const othersTaxable = others.map(rowTaxable);
  if ([...directTaxable, ...othersTaxable].includes(undefined)) return undefined;
  const indirect = atLeast(0, rolledOver - sum(...direct.map((row) => row.box1)));
  return sum(...directTaxable) + atLeast(0, sum(...othersTaxable) - indirect);
}

/*
 * Exception 2: a person who files Form 8606 takes the traditional IRA part
 * from it (the line 4b binding).
 */
function iraLine(inputs: ResolverInputs, rows: RetirementDistributionFactValue[]): IraLine {
  const filers = new Set(form8606Filers(inputs).map((holder) => holder.owner));
  const rolledOver = (owner: IraOwner) =>
    (inputs.factByKey.get(makeTraditionalIraFactKey(owner)) as TraditionalIraFactValue | undefined)
      ?.rolledOver ?? 0;
  // A Form 8606 filer's traditional rows come from that form, so none are summed here.
  const ownerTaxable = (owner: IraOwner): number | undefined => {
    const own = rows.filter((row) => (row.owner ?? "taxpayer") === owner);
    const roth = own.filter(isRothIra).map(rowTaxable);
    const traditional = filers.has(owner)
      ? 0
      : traditionalTaxable(
          own.filter((row) => !isRothIra(row)),
          rolledOver(owner),
        );
    if ([...roth, traditional].includes(undefined)) return undefined;
    return sum(...roth, traditional);
  };
  const perOwner = OWNERS.map(ownerTaxable);
  return {
    gross: sum(...rows.map((distribution) => distribution.box1)),
    taxable: perOwner.includes(undefined) ? undefined : sum(...perOwner),
    rollover:
      rows.some((distribution) => hasDistributionCode(distribution, ROLLOVER_CODES)) ||
      OWNERS.some((owner) => rolledOver(owner) > 0),
    form8606Filers: filers.size,
  };
}

function resolveRetirementSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const rows = retirementRows(inputs);
  const isIra = (distribution: RetirementDistributionFactValue) =>
    distribution.box7IraSepSimple || isRothIra(distribution);
  const iraRows = rows.filter(isIra);
  const pensionRows = rows.filter((row) => !isIra(row));
  const taxable = pensionRows.map(rowTaxable);
  return {
    iraDistributions: iraRows.length === 0 ? undefined : iraLine(inputs, iraRows),
    pensionDistributions:
      pensionRows.length === 0
        ? undefined
        : {
            gross: sum(...pensionRows.map((distribution) => distribution.box1)),
            taxable: taxable.includes(undefined) ? undefined : sum(...taxable),
            rollover: pensionRows.some((distribution) =>
              hasDistributionCode(distribution, ROLLOVER_CODES),
            ),
          },
  };
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
    ...retirementRows(inputs).map((row) => row.box4),
    ...socialSecurityRows(inputs).map((row) => row.box6),
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
  const resolution = resolveMustFile(decisionByKey, {
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
    mustFile: { "form-1040": resolution },
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
        // Line 12d: on a joint return the spouse's age raises the standard deduction.
        ...(filingStatus === "married_filing_jointly"
          ? { [SPOUSE_KEYS.dob]: text(inputs, SPOUSE_KEYS.dob) }
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
        ? (sum(
            ...ss.map((benefit) => benefit.box5),
          ) as Form1040FilingInfo["socialSecurityBenefits"])
        : undefined,
    livedApartFromSpouseAllYear: livedApart,
    spouseItemizesSeparately: spouseItemizes,
    refundFullOverpaymentFederal,
    useItemizedDeductions,
  };
}
