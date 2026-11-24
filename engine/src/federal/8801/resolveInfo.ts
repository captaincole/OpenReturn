import {
  getPriorYearMinimumTax,
  PRIOR_YEAR_MINIMUM_TAX_KEYS as KEYS,
  priorYearMinimumTaxKeysOnFile,
  type PriorYearForm6251,
  type PriorYearMinimumTax,
} from "../../facts/index.js";
import { roundDollars, sum } from "../../money.js";
import { missingInputs, resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { FilingStatus } from "../../values.js";
import type { Form8801FilingInfo, Form8801PriorYear } from "./filingInfo.js";
import { lines11To15, lines16To21, lines1To10, taxAtAmtRates } from "./lines.js";
import { partIIILines } from "./partIII.js";

export const FORM_2555_GAP =
  "A 2024 Form 2555 sends line 11 to the Foreign Earned Income Tax Worksheet (irs-8801-inst-2025::sec::line-11::b01), which needs the 2024 Form 2555 lines 45 and 50 and the items it excluded; the engine has no Form 2555 rules.";
export const FORM_1116_GAP =
  "The 2024 foreign tax credit used Form 1116, so line 12 is the AMT foreign tax credit refigured on a second set of 2024 Forms 1116 with only exclusion items (irs-8801-inst-2025::sec::line-12::b01), which the engine does not figure.";

/* A stated amount the form prints only when it is not 0. */
const nonZeroOrBlank = (value: number | undefined): number | undefined =>
  value === undefined || value === 0 ? undefined : roundDollars(value);

/* Line 2 has the deduction line 3 subtracts only with a 2024 net operating loss deduction (line 2e). */
const hasNolDeduction = (form6251: PriorYearForm6251 | undefined) => (form6251?.line2e ?? 0) > 0;

/*
 * Line 1: 2024 Form 6251 lines 1 and 2e. Line 2: lines 2a, 2b, 2c, 2d, 2g and 2h,
 * and the other exclusion items (irs-8801-inst-2025::sec::line-2::b01, b02).
 * Line 2a already holds the 2024 standard deduction of a filer with no Schedule A.
 */
function line1And2(form6251: PriorYearForm6251, otherExclusionItems: number) {
  const { line2a, line2b, line2c, line2d, line2g, line2h } = form6251;
  return {
    line1: roundDollars(sum(form6251.line1, form6251.line2e)),
    line2: roundDollars(sum(line2a, line2b, line2c, line2d, line2g, line2h, otherExclusionItems)),
  };
}

/* Lines 16–21 after line 15 (Part II reads 2024 Form 6251 line 11 and 2024 Form 8801 line 26). */
function partIIOf(answers: PriorYearMinimumTax, form6251: PriorYearForm6251, line15: number) {
  return lines16To21(
    line15,
    roundDollars(form6251.line11),
    nonZeroOrBlank(answers.creditCarryforward),
    nonZeroOrBlank(answers.unallowedElectricVehicleCredit),
  );
}

type Line11 = Pick<Form8801PriorYear, "line11" | "partIII" | "line11Gap" | "partIIIGap">;
type Line12 = Pick<Form8801PriorYear, "line12" | "line12Gap">;

/*
 * Line 11 (the blank form): a 2024 Form 2555 is a gap; a 2024 worksheet sends
 * the filer to Part III (line 55); all others tax line 10 at the AMT rates.
 */
function line11Of(answers: PriorYearMinimumTax, status: FilingStatus, line10: number): Line11 {
  const worksheet = answers.capitalGainWorksheet;
  if (answers.filedForm2555 === true) {
    const usesPartIII = worksheet !== undefined && worksheet.worksheet !== "none";
    return { line11Gap: FORM_2555_GAP, partIIIGap: usesPartIII ? FORM_2555_GAP : undefined };
  }
  if (worksheet === undefined || worksheet.worksheet === "none") {
    return { line11: taxAtAmtRates(line10, status) };
  }
  const partIII = partIIILines(line10, status, worksheet);
  return { line11: partIII.line55, partIII };
}

/* Line 12: blank with no 2024 AMT foreign tax credit; the election's Schedule 3 line 1; else a gap. */
function line12Of(answers: PriorYearMinimumTax, form6251: PriorYearForm6251): Line12 {
  if ((form6251.line8 ?? 0) <= 0) return {};
  const credit = answers.foreignTaxCredit;
  if (credit?.method === "election_without_form_1116") {
    return { line12: nonZeroOrBlank(credit.scheduleThreeLine1) };
  }
  return { line12Gap: FORM_1116_GAP };
}

/* Lines 11–21 once line 10 is above 0 and the answers it needs are on file. */
function fromLine11(
  answers: PriorYearMinimumTax,
  form6251: PriorYearForm6251,
  status: FilingStatus,
  base: Pick<Form8801PriorYear, "upTo10"> & { line10: number },
): Form8801PriorYear {
  const eleven: Line11 = line11Of(answers, status, base.line10);
  const twelve: Line12 = line12Of(answers, form6251);
  const line14 = roundDollars(form6251.line10);
  const lines = { upTo10: base.upTo10, line14, ...eleven, ...twelve };
  if (eleven.line11 === undefined || twelve.line12Gap !== undefined) return lines;
  const upTo15 = lines11To15(eleven.line11, twelve.line12, line14);
  return {
    ...lines,
    upTo15,
    line15: upTo15.line15,
    partII: partIIOf(answers, form6251, upTo15.line15),
  };
}

type Figured = { priorYear?: Form8801PriorYear; missing: string[] };

/*
 * Lines 1–21 from the answers, or the answers still missing. Line 3 is asked
 * only with a 2024 net operating loss deduction; the worksheet and Form 2555
 * only when line 10 is above 0; the foreign tax credit only when 2024 Form 6251
 * line 8 is too (QUESTIONS.md).
 */
function figurePriorYear(answers: PriorYearMinimumTax): Figured {
  const { filingStatus: status, form6251 } = answers;
  const needsLine3 = hasNolDeduction(form6251);
  const first = missingInputs({
    [KEYS.filingStatus]: status,
    [KEYS.form6251]: form6251,
    [KEYS.otherExclusionItems]: answers.otherExclusionItems,
    [KEYS.creditCarryforward]: answers.creditCarryforward,
    ...(needsLine3
      ? { [KEYS.minimumTaxCreditNolDeduction]: answers.minimumTaxCreditNolDeduction }
      : {}),
  });
  if (first.length > 0 || status === undefined || form6251 === undefined) return { missing: first };
  const { line1, line2 } = line1And2(form6251, answers.otherExclusionItems ?? 0);
  const line3 = needsLine3 ? nonZeroOrBlank(answers.minimumTaxCreditNolDeduction) : undefined;
  const upTo10 = lines1To10(status, line1, line2, line3);
  const line10 = upTo10.line10 ?? 0;
  if (line10 === 0) {
    return {
      priorYear: { upTo10, line15: 0, partII: partIIOf(answers, form6251, 0) },
      missing: [],
    };
  }
  const second = missingInputs({
    [KEYS.capitalGainWorksheet]: answers.capitalGainWorksheet,
    [KEYS.filedForm2555]: answers.filedForm2555,
    ...((form6251.line8 ?? 0) > 0 ? { [KEYS.foreignTaxCredit]: answers.foreignTaxCredit } : {}),
  });
  if (second.length > 0) return { priorYear: { upTo10 }, missing: second };
  return { priorYear: fromLine11(answers, form6251, status, { upTo10, line10 }), missing: [] };
}

/*
 * Who files (irs-8801-inst-2025::sec::who-should-file::b01): a 2024 AMT with
 * deferral items, a 2024 carryforward, or an unallowed electric vehicle credit;
 * "File Form 8801 only if line 21 is more than zero." A minimum tax answer on
 * file puts the form in scope: it files while line 21 waits or is a gap, and
 * stops when line 21 is figured and not above 0. The explicit decision wins.
 */
export function resolve8801Info(inputs: ResolverInputs): Form8801FilingInfo {
  const answers = getPriorYearMinimumTax(inputs.factByKey);
  const onFile = priorYearMinimumTaxKeysOnFile(inputs.factByKey);
  const figured: Figured = figurePriorYear(answers);
  const line21 = figured.priorYear?.partII?.line21;
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8801",
    fallbacks: [
      {
        rule: `fallback: ${onFile.length} minimum tax answer(s) for 2024 on file; line 21 is ${line21 ?? "not figured yet"} (files only above 0)`,
        value: onFile.length > 0 && (line21 === undefined || line21 > 0),
        triggeredByFactKeys: onFile,
      },
    ],
  });
  if (mustFile.value !== true) return { mustFile: { "form-8801": mustFile } };
  return {
    mustFile: { "form-8801": mustFile },
    missingInputs: { "form-8801": figured.missing },
    form8801PriorYear: figured.priorYear,
  };
}
