/*
 * What one fund's Form 8621 sends to the rest of an individual's return. Each
 * amount names the instruction that places it.
 */

import { atLeast, sum } from "../../money.js";
import type { PartIIILines, PartIVDisposition, PartIVYearEnd } from "./lines.js";
import { markToMarketOrdinary } from "./lines.js";
import type { PartV } from "./partV.js";
import type { PartVIColumn } from "./partVI.js";

export interface FundResults {
  /*
   * Schedule 1 line 8z: line 6c ("other income", irs-8621-inst-2025::sec::line-6c::b01),
   * lines 10c or 12 and 13c or 14b ("the other income line", ::lines-10c-and-12::b01,
   * ::line-13c::b01, ::line-14b::b01), and line 16b (::lines-16a-and-16b::b01).
   */
  otherIncome: number;
  /* Schedule D line 11: line 7c, a net long-term capital gain (::line-7c::b01; QUESTIONS.md, question 1). */
  capitalGain: number;
  /* Form 1040 line 3b and Schedule B line 5: the nonexcess distributions (::line-15c::b01, ::line-15a::b01). Cents kept. */
  dividendsUsd: number;
  /* Form 1040 line 16, box 3 "1291TAX": line 16e (::line-16e::b01). */
  section1291Tax: number;
  /* Schedule 2 line 17p: line 16f (::line-16f::b02). */
  section1291Interest: number;
  /* Schedule 2 line 17z "1294DT": line 23 of each column (::line-23::b01). */
  deferredTaxDue: number;
  /* Schedule 2 line 17q: line 24 of each column (::line-24::b01). */
  deferredTaxInterest: number;
  /* Form 8960 line 6: the PFIC income that no other Form 8960 line holds (irs-8960-inst-2025::sec::line-6-adjustments-to-investment-income-for::b02–b03). */
  netInvestmentIncomeAddition: number;
  /* Form 8960 line 5b: a QEF's line 7c without a section 1.1411-10(g) election, subtracted (::b05). */
  netInvestmentIncomeGainExcluded: number;
  section1411gElection: boolean;
  /* The foreign tax for the general credit rules (Form 1116), its income, in U.S. dollars and the fund's currency. */
  foreignTaxUsd: number;
  foreignTax: number;
  foreignIncomeUsd: number;
  /* Why lines that take this fund's amounts cannot be figured. */
  gap?: string;
  /* Line 14c follows the general loss rules: Form 8949, which the engine does not fill from this form. */
  generalRulesLoss?: number;
}

interface Parts {
  partIII?: PartIIILines;
  partIV?: { yearEnd?: PartIVYearEnd; sale?: PartIVDisposition };
  partV?: PartV;
  partVI?: PartVIColumn[];
}

/* Form 8960 line 6 for a section 1291 fund: every excess distribution and gain (::b03; QUESTIONS.md, question 11). */
function section1291Nii(partV: PartV | undefined): number {
  if (partV === undefined) return 0;
  return sum(partV.line15.line15e2, partV.deemedDividend, atLeast(0, partV.line15.line15f));
}

export function fundResults(parts: Parts, section1411gElection: boolean): FundResults {
  const { partIII, partIV, partV, partVI } = parts;
  const markToMarket = partIV ? markToMarketOrdinary(partIV.yearEnd, partIV.sale) : 0;
  const line16 = partV?.line16;
  const columns = partVI ?? [];
  const qefOrdinary = partIII?.line6c ?? 0;
  return {
    otherIncome: sum(qefOrdinary, markToMarket, line16?.line16b),
    capitalGain: partIII?.line7c ?? 0,
    dividendsUsd: partV?.line15.dividendsUsd ?? 0,
    section1291Tax: line16?.line16e ?? 0,
    section1291Interest: line16?.line16f ?? 0,
    deferredTaxDue: sum(...columns.map((column) => column.line23)),
    deferredTaxInterest: sum(...columns.map((column) => column.line24)),
    netInvestmentIncomeAddition: sum(
      markToMarket,
      section1291Nii(partV),
      section1411gElection ? qefOrdinary : 0,
    ),
    netInvestmentIncomeGainExcluded: section1411gElection ? 0 : (partIII?.line7c ?? 0),
    section1411gElection: section1411gElection && partIII !== undefined,
    foreignTaxUsd: sum(partV?.line15.dividendForeignTaxUsd, line16?.generalRulesForeignTaxUsd),
    foreignTax: sum(partV?.line15.dividendForeignTax, line16?.generalRulesForeignTax),
    foreignIncomeUsd: sum(partV?.line15.dividendsUsd, line16?.currentYearDistributionsUsd),
    gap: partV?.line16Gap,
    generalRulesLoss: partIV?.sale?.line14c,
  };
}
