/*
 * Part VII, the rehabilitation credit under section 47
 * (irs-3468-face-2025::sec::face-part-vii::b01, ::b02;
 * irs-3468-inst-2025::sec::part-vii-rehabilitation-credit-under::b01 to ::line-1m::b02).
 */

import type { InvestmentCreditFacility, RehabilitationInvestment } from "../../facts/index.js";
import { unsupported } from "../../types.js";
import { ISODate, isoDate } from "../../values.js";
import { yesNo } from "./cells.js";
import { times } from "./lines.js";
import type { PartResult } from "./parts.js";
import type { Lines } from "./sectionLines.js";

/* Line 1j: "multiply line 1g by 4% (0.04)", the yearly fifth of the 20% credit (line-1j::b01). */
export const REHABILITATION_YEARLY_RATE = 0.04;
/* "allowed ratably over a 5-year period beginning in the tax year that the ... building is placed in service" (line-1j::b01). */
export const RATABLE_YEARS = 5;
export const TAX_YEAR = 2025;
/* Substantially rehabilitated: the expenditures are "more than the greater of $5,000 or your adjusted basis" (part-vii-rehabilitation-credit-under::b02). */
export const SUBSTANTIAL_REHABILITATION_FLOOR = 5_000;

const PROGRESS_GAP =
  "The building is not placed in service by the end of 2025 and the section 47(d)(5) election is made: the instructions do not say how the 5-year ratable credit applies to progress expenditures (irs-3468-inst-2025::sec::line-1c-2::b01, ::line-1j::b01).";

const usDate = (date: string | undefined) =>
  date === undefined ? undefined : ISODate.usSlash(isoDate(date));

/* "more than the greater of $5,000 or your adjusted basis in the building" (part-vii-rehabilitation-credit-under::b02). */
export const substantiallyRehabilitated = (investment: RehabilitationInvestment): boolean =>
  investment.expendituresInMeasuringPeriod >
  Math.max(SUBSTANTIAL_REHABILITATION_FLOOR, investment.adjustedBasis);

/* The tax years of the 5-year period: the year placed in service and the four after it. */
export function inRatablePeriod(placedInService: string): boolean {
  const year = Number(placedInService.slice(0, 4));
  return year <= TAX_YEAR && TAX_YEAR < year + RATABLE_YEARS;
}

/* Lines 1a to 1g, as stated. */
function statedLines(investment: RehabilitationInvestment): Lines {
  return {
    ...yesNo("1a_prior_170h_deduction", investment.priorConservationDeduction),
    "1b": investment.priorConservationDeduction ? investment.priorNpsNumber : undefined,
    "1c": investment.progressExpenditureElection === true ? true : undefined,
    "1d_measuring_period_beginning_date": usDate(investment.measuringPeriod.begin),
    "1d_measuring_period_end_date": usDate(investment.measuringPeriod.end),
    "1e": investment.adjustedBasis,
    "1f": investment.expendituresInMeasuringPeriod,
    "1g": investment.qualifiedExpenditures,
    "1m": usDate(investment.certificationDeadline),
  };
}

/*
 * Line 1j for a qualified rehabilitated building in its 5-year period; 0 for a
 * building that is not substantially rehabilitated or whose period ended
 * (QUESTIONS.md). Line 1k names the NPS project when line 1j has a credit.
 */
export function rehabilitationLines(
  investment: RehabilitationInvestment,
  facility: InvestmentCreditFacility,
  passThroughEin: string | undefined,
): PartResult {
  const lines = statedLines(investment);
  const placed = facility.placedInService < `${TAX_YEAR + 1}-01-01`;
  if (!placed && investment.progressExpenditureElection === true) {
    const gap = unsupported(PROGRESS_GAP);
    return { lines: { ...lines, "1j": gap, "3": gap }, total: 0, gap: PROGRESS_GAP };
  }
  const qualifies = placed && substantiallyRehabilitated(investment);
  const line1j =
    qualifies && inRatablePeriod(facility.placedInService)
      ? times(investment.qualifiedExpenditures, REHABILITATION_YEARLY_RATE)
      : 0;
  if (line1j > 0) {
    Object.assign(lines, {
      "1k_i_nps_project_number": investment.npsProjectNumber,
      "1k_ii_pass_through_entity_ein": passThroughEin,
      "1k_iii_nps_certification_date": usDate(investment.certificationDate),
    });
  }
  return { lines: { ...lines, "1j": line1j, "3": line1j }, total: line1j };
}
