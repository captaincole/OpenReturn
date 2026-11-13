import {
  ROTH_IRA_CODES,
  SPOUSE_KEYS,
  getGamblingWinningsFacts,
  getNonemployeeCompensationFacts,
  getPaymentTransactionsFacts,
  hasDistributionCode,
  isCorrectiveDistribution,
  isDividendFactKey,
  isInterestFactKey,
  isMiscIncomeFactKey,
  isRetirementDistributionFactKey,
  isSocialSecurityFactKey,
  readRothIraFact,
  readTraditionalIraFact,
  type IraOwner,
  type MiscIncomeFactValue,
  type RetirementDistributionFactValue,
  type SocialSecurityFactValue,
} from "../../facts/index.js";
import { filingStatusOf, hasW2, resolveScheduleDInfo } from "../../filingInfoResolvers.js";
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
import { NONQUALIFIED_ROTH_CODES, partIIIFigures } from "../8606/partIII.js";
import { form8606Filers } from "../8606/resolveInfo.js";
import { needsPub590AWorksheets } from "../schedule-1/pub590a.js";
import { resolveScheduleAInfo } from "../schedule-a/resolveInfo.js";
import { eicQuestions, resolveEicLineInfo } from "../schedule-eic/eicAnswers.js";
import {
  disabilityAnswersComplete,
  disabilityPensions,
  disabilityWages,
} from "./disabilityPensions.js";
import type { Form1040FilingInfo, IraLine } from "./filingInfo.js";
import { line1hGap } from "./line1hGaps.js";

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
 * Part III (rothTaxable below), so box 2a is not used here. Code Y, a qualified
 * charitable distribution, is not modeled (1040 inst., lines 4a/4b, Exception 3).
 */
export function rowTaxable(distribution: RetirementDistributionFactValue): number | undefined {
  if (distribution.box7.includes("Q")) return 0;
  if (hasDistributionCode(distribution, ["J", "T", "Y"])) return undefined;
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
 * A person's Roth IRA rows: code Q is not taxable; codes J and T take Form 8606
 * line 25c (Part III, partIII.ts), once for all of them, when the Roth IRA
 * answers are there. Line 23 of zero means nothing is taxable.
 */
function rothTaxable(
  inputs: ResolverInputs,
  owner: IraOwner,
  rows: RetirementDistributionFactValue[],
): Array<number | undefined> {
  const qualified = rows.filter((row) => !hasDistributionCode(row, NONQUALIFIED_ROTH_CODES));
  const partIII = rows.filter((row) => hasDistributionCode(row, NONQUALIFIED_ROTH_CODES));
  if (partIII.length === 0) return qualified.map(rowTaxable);
  const answers = readRothIraFact(inputs.factByKey, owner);
  const line25c = answers ? partIIIFigures(partIII, answers).line25c : undefined;
  return [...qualified.map(rowTaxable), line25c];
}

/*
 * Exception 2: a person who files Form 8606 takes the taxable part from it
 * (the line 4b binding): line 18 for a Roth conversion, and line 15c for the
 * other distributions when Part I applies. Without Part I there is no basis
 * to share out, so those distributions stay taxable as the 1099-Rs show.
 */
function iraLine(inputs: ResolverInputs, rows: RetirementDistributionFactValue[]): IraLine {
  const filers = form8606Filers(inputs);
  const filerOf = (owner: IraOwner) => filers.find((holder) => holder.owner === owner);
  const ownerTaxable = (owner: IraOwner): number | undefined => {
    const own = rows.filter((row) => (row.owner ?? "taxpayer") === owner);
    const roth = rothTaxable(inputs, owner, own.filter(isRothIra));
    const ira = readTraditionalIraFact(inputs.factByKey, owner);
    const filer = filerOf(owner);
    // A conversion is taken off the rows here, because line 18 gives its taxable part.
    const notOnRows = (ira?.rolledOver ?? 0) + (filer ? (ira?.convertedToRoth ?? 0) : 0);
    const traditional = filer?.partI
      ? 0
      : traditionalTaxable(
          own.filter((row) => !isRothIra(row)),
          notOnRows,
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
      OWNERS.some(
        (owner) => (readTraditionalIraFact(inputs.factByKey, owner)?.rolledOver ?? 0) > 0,
      ),
    form8606Filers: filers.length,
    // Part I without a distribution or a conversion leaves line 15c blank and adds nothing.
    form8606PartI:
      filers.length === 1 &&
      filers[0].partI &&
      (filers[0].line7 > 0 || (filers[0].ira?.convertedToRoth ?? 0) > 0),
    form8606Line1Gap: filers.length === 1 ? filers[0].line1Gap : undefined,
  };
}

/*
 * A disability pension before the minimum retirement age goes on line 1h, not
 * line 5 (disabilityPensions.ts), and so does a corrective distribution
 * (isCorrectiveDistribution). While a pension's answer is missing, lines 1h and
 * 5a–5b wait.
 */
function resolveRetirementSlots(inputs: ResolverInputs): Form1040FilingInfo {
  const rows = retirementRows(inputs);
  const isIra = (distribution: RetirementDistributionFactValue) =>
    distribution.box7IraSepSimple || isRothIra(distribution);
  const iraRows = rows.filter(isIra);
  const disability = disabilityPensions(inputs);
  const onLine1h = new Set(
    disability
      .filter((pension) => pension.beforeMinimumRetirementAge === true)
      .map((pension) => pension.distribution),
  );
  const corrective = rows.filter(isCorrectiveDistribution);
  const pensionRows = rows.filter(
    (row) => !isIra(row) && !onLine1h.has(row) && !isCorrectiveDistribution(row),
  );
  const taxable = pensionRows.map(rowTaxable);
  const answered = disabilityAnswersComplete(disability);
  const disabilityPensionWages = onLine1h.size === 0 ? undefined : disabilityWages(disability);
  const correctiveTaxable = corrective.map(rowTaxable);
  return {
    iraDistributions: iraRows.length === 0 ? undefined : iraLine(inputs, iraRows),
    disabilityPensionWages,
    correctiveDistributionWages:
      corrective.length === 0 || correctiveTaxable.includes(undefined)
        ? undefined
        : sum(...correctiveTaxable),
    line1hWaits:
      !answered ||
      (onLine1h.size > 0 && disabilityPensionWages === undefined) ||
      correctiveTaxable.includes(undefined),
    line1hGap: line1hGap(inputs),
    pensionDistributions:
      pensionRows.length === 0 || !answered
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

/*
 * Line 25b (irs-1040-inst-2025::sec::line-25b-form-s-1099::b01): box 4 of each
 * Form 1099, SSA-1099 box 6. 1099-K box 4 is backup withholding to "include …
 * as tax withheld" (irs-1099k-form-2025::sec::instructions-for-payee::b03).
 * 1099-NEC and 1099-MISC box 4 are Form 1099 box 4s too, whether or not the
 * 1099-MISC belongs to a business.
 */
function form1099Withholding(
  inputs: ResolverInputs,
): Form1040FilingInfo["form1099FederalWithholding"] {
  const total = sum(
    sumInvestmentBox(inputs, "box4"),
    ...retirementRows(inputs).map((row) => row.box4),
    ...socialSecurityRows(inputs).map((row) => row.box6),
    ...getPaymentTransactionsFacts(inputs.facts).map((form) => form.value.box4),
    ...getNonemployeeCompensationFacts(inputs.facts).map((form) => form.value.box4),
    ...factsInCategory(inputs, "other")
      .filter((row) => isMiscIncomeFactKey(row.key))
      .map((row) => (row.value as MiscIncomeFactValue).box4),
  );
  return total > 0 ? (total as Form1040FilingInfo["form1099FederalWithholding"]) : undefined;
}

/* Line 25c (irs-1040-inst-2025::sec::line-25c-other-forms::b01): W-2G box 4. */
function w2gWithholding(inputs: ResolverInputs): Form1040FilingInfo["w2gFederalWithholding"] {
  const total = sum(...getGamblingWinningsFacts(inputs.facts).map((w2g) => w2g.box4));
  return total > 0 ? (total as Form1040FilingInfo["w2gFederalWithholding"]) : undefined;
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
  const livedApartLastSix = factByKey.get(SPOUSE_KEYS.livedApartLastSixMonths) as
    boolean | undefined;
  const legallySeparated = factByKey.get(SPOUSE_KEYS.legallySeparatedApartAtYearEnd) as
    boolean | undefined;
  const earnedIncomeCredit = resolveEicLineInfo(inputs);
  return {
    pub590aWorksheets: needsPub590AWorksheets(inputs),
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
        // Page 1 box: asked of MFS only (married by definition); most HOH filers are unmarried.
        ...(filingStatus === "married_filing_separately" && livedApart !== true
          ? { [SPOUSE_KEYS.livedApartLastSixMonths]: livedApartLastSix }
          : {}),
        // Legal separation can still check the box when the 6-months answer is no.
        ...(filingStatus === "married_filing_separately" && livedApartLastSix === false
          ? { [SPOUSE_KEYS.legallySeparatedApartAtYearEnd]: legallySeparated }
          : {}),
        // Lines 1h and 5a: each disability pension came before the minimum retirement age, or after.
        ...Object.fromEntries(
          disabilityPensions(inputs).map((pension) => [
            pension.answerKey,
            pension.beforeMinimumRetirementAge,
          ]),
        ),
        // Line 27a: asked only while the EIC is possible.
        ...eicQuestions(inputs, earnedIncomeCredit),
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
    w2gFederalWithholding: w2gWithholding(inputs),
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
    livedApartFromSpouseLastSixMonths: livedApartLastSix,
    legallySeparatedApartAtYearEnd: legallySeparated,
    spouseItemizesSeparately: spouseItemizes,
    refundFullOverpaymentFederal,
    useItemizedDeductions,
    earnedIncomeCredit,
  };
}
