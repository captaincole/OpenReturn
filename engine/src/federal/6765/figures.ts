/*
 * Form 6765 from the research credit fact: every line that reads only the
 * fact. Line 29 reads the K-1s (resolveInfo.ts) and lines 35 and 36 read
 * Form 3800 (bindings.ts). It reads only the fact, so the facts layer can
 * call it: a gap is its reason (lines.ts FigureGap).
 */

import type { ResearchCreditFactValue } from "../../facts/kinds/researchCredit.js";
import { roundDollars, sum } from "../../money.js";
import {
  fixedBasePercentage,
  isFigureGap,
  line28Of,
  line34Of,
  payrollElectionGap,
  regularCredit,
  simplifiedCredit,
  type FigureGap,
  type RegularCredit,
  type SimplifiedCredit,
} from "./lines.js";
import {
  sectionFFromExpenses,
  sectionFFromSectionG,
  sectionGOf,
  type SectionF,
  type SectionG,
} from "./qualifiedExpenses.js";

export interface PayrollLines {
  line34: number;
  differentEin: boolean;
}

export interface ResearchFigures {
  sectionF: SectionF;
  sectionG?: SectionG;
  /* Section A, or line 6's gap; undefined when Section A is skipped. */
  regular?: RegularCredit | FigureGap;
  /* Section B; undefined when it is skipped. */
  simplified?: SimplifiedCredit;
  /* Line 13 or 26 when the engine cannot figure it (a controlled group). */
  creditGap?: FigureGap;
  line27?: number;
  /* Undefined with no credit figured (Item A answered with no QREs). */
  line28?: number | FigureGap;
  /* Section D, or why the election cannot be made; undefined without the election. */
  payroll?: PayrollLines | FigureGap;
}

/*
 * Item B: "Use Section A or B to figure the credit for the entire group. As a
 * member, your credit is determined on a proportionate basis to your share of
 * the aggregate QREs" (irs-6765-inst-2025::sec::member-of-controlled-group-of::b01),
 * shown on the group credit attachment (line-13::b01).
 */
export const CONTROLLED_GROUP_GAP =
  "A member of a controlled group or of businesses under common control enters its share of the group's credit from the group credit attachment, which the engine does not figure.";

function creditSections(value: ResearchCreditFactValue, qres: number) {
  const base = {
    energyConsortia: value.energyConsortiaPayments,
    qres,
    reduced: value.reducedCreditElection,
  };
  if (value.method === "alternative_simplified") {
    const simplified = simplifiedCredit({
      ...base,
      priorThreeYearsQres: value.priorThreeYearsQres ?? [],
    });
    return { simplified, credit: simplified.line26 };
  }
  const fixedBase = value.fixedBase
    ? fixedBasePercentage(value.fixedBase)
    : { gap: "No fixed-base percentage is stated." };
  if (isFigureGap(fixedBase)) return { regular: fixedBase, credit: fixedBase };
  const regular = regularCredit({
    ...base,
    fixedBase,
    grossReceiptsPriorYears: value.grossReceiptsPriorYears,
  });
  return { regular, credit: regular.line13 };
}

function payrollOf(value: ResearchCreditFactValue): PayrollLines | FigureGap | undefined {
  const election = value.payrollTaxElection;
  if (election === undefined) return undefined;
  const gap = payrollElectionGap(election);
  if (gap) return { gap };
  return { line34: line34Of(election), differentEin: election.differentEin === true };
}

/*
 * The lines of the fact. A section is skipped with no QREs and no energy
 * consortia payments: electing the reduced credit "when no research credits
 * are claimed on the original return doesn't mean that you are claiming
 * either the regular method or making the ASC election"
 * (irs-6765-inst-2025::sec::item-a-section-280c-election::b01).
 */
function sectionsFOf(value: ResearchCreditFactValue) {
  const sectionG = value.businessComponents ? sectionGOf(value.businessComponents) : undefined;
  const sectionF = sectionG ? sectionFFromSectionG(sectionG) : sectionFFromExpenses(value.expenses);
  const claimed = sum(sectionF.line48, value.energyConsortiaPayments) > 0;
  return { sectionF, sectionG, claimed };
}

/*
 * A credit with QREs or energy consortia payments and no method: Section A or
 * B figures every credit ("Skip this section and go to Section B if you are
 * electing ... the alternative simplified credit", irs-6765-face-2025::sec::face-page-1::b01),
 * so line 28 waits on the fact's method, and the form asks for the fact.
 */
export function waitsOnMethod(value: ResearchCreditFactValue): boolean {
  return value.method === undefined && sectionsFOf(value).claimed;
}

export function researchFiguresOf(value: ResearchCreditFactValue): ResearchFigures {
  const { sectionF, sectionG, claimed } = sectionsFOf(value);
  const payroll = payrollOf(value);
  if (!claimed || value.method === undefined) return { sectionF, sectionG, payroll };
  const { credit, ...sections } = creditSections(value, sum(sectionF.line48));
  const line27 = roundDollars(value.differentialWageCreditPortion);
  if (value.controlledGroup) {
    const creditGap = { gap: CONTROLLED_GROUP_GAP };
    return { sectionF, sectionG, ...sections, creditGap, line27, line28: creditGap, payroll };
  }
  const line28 = isFigureGap(credit) ? credit : line28Of(credit, line27);
  return { sectionF, sectionG, ...sections, line27, line28, payroll };
}

/*
 * The 280C reduction: "If you don't elect the reduced credit, you must reduce
 * your domestic research or experimental expenditures under section 174A
 * otherwise taken into account as a deduction ... by the amount of the
 * research credit" (irs-6765-inst-2025::sec::item-a-section-280c-election::b01).
 * The credit is line 28, the taxpayer's own credit after the Form 8932 part;
 * a payroll tax credit is "treated as a research credit for purposes of the
 * reduced credit" (::b02) and is inside line 28. Undefined with the election,
 * with no credit, or while line 28 is a gap.
 */
export function deductionReductionOf(value: ResearchCreditFactValue): number | undefined {
  if (value.reducedCreditElection) return undefined;
  const line28 = researchFiguresOf(value).line28;
  return typeof line28 === "number" && line28 > 0 ? line28 : undefined;
}
