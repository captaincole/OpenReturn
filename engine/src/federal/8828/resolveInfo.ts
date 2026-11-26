import {
  getMortgageSubsidyHomes,
  type MortgageSubsidyHome,
  type MortgageSubsidyNoticeFactValue,
  type MortgageSubsidySaleFactValue,
} from "../../facts/index.js";
import { resolveMustFile, type ResolverInputs } from "../../resolverInputs.js";
import type { Form8828FactLines, Form8828FilingInfo } from "./filingInfo.js";
import {
  adjustedQualifyingIncome,
  gainLines,
  holdingPeriod,
  repaymentWorksheet,
  subsidizedAmountForInterest,
  tableRowFor,
  usesRepaymentWorksheet,
  withinRecapturePeriod,
  yearsHeld,
} from "./lines.js";

const QSML =
  'A qualifying subordinate mortgage loan: line 13 needs "QSML" on the dotted line and an attached worksheet of the gain shared with the lender (irs-8828-inst-2025::sec::line-13::b01), which the engine does not print.';
const NO_TABLE_ROW =
  "The notice's table has no line for the number of full and partial years the home was held (irs-8828-inst-2025::sec::line-16::b01), so lines 16 and 20 have no value.";

/* A home is on the return when it was sold or otherwise disposed of: it has a sale fact. */
type SoldHome = MortgageSubsidyHome & { sale: MortgageSubsidySaleFactValue };

const isSold = (home: MortgageSubsidyHome): home is SoldHome => home.sale !== undefined;

/*
 * A sold home files unless its notice shows the loan closed before 1991 or the
 * sale came after the 9-year period (lines.ts, withinRecapturePeriod). With no
 * notice yet, it files and waits for the notice.
 */
const files = (home: SoldHome): boolean =>
  home.notice === undefined ||
  withinRecapturePeriod(home.notice.loanClosingDate, home.sale.dispositionDate);

const joined = (parts: ReadonlyArray<string | undefined>): string =>
  parts.filter((part): part is string => part !== undefined && part !== "").join(", ");

/* The first unsupported line of the form, if any. */
function gapOf(
  sale: MortgageSubsidySaleFactValue,
  line16: number | undefined,
): Form8828FactLines["gap"] {
  if (sale.qsmlShareOfGain !== undefined) return { fromLine: 13, reason: QSML };
  return line16 === undefined ? { fromLine: 16, reason: NO_TABLE_ROW } : undefined;
}

/* Every line the facts settle (Part I, lines 9–14, 16, 19, 20). */
function factLines(
  notice: MortgageSubsidyNoticeFactValue,
  sale: MortgageSubsidySaleFactValue,
): Form8828FactLines {
  const closing = notice.loanClosingDate;
  const saleDate = sale.dispositionDate;
  const repayment = sale.fullRepaymentDate;
  const row = tableRowFor(notice.table, yearsHeld(closing, saleDate));
  const line16 = row ? adjustedQualifyingIncome(row, sale.familySizeAtSale) : undefined;
  const worksheet =
    repayment !== undefined && usesRepaymentWorksheet(closing, repayment, saleDate)
      ? repaymentWorksheet(closing, repayment, saleDate)
      : undefined;
  return {
    propertyAddress: sale.propertyAddress,
    subsidyType: notice.subsidyType,
    issuer: joined([notice.issuerState, notice.issuerPoliticalSubdivision, notice.issuerAgency]),
    lender: joined([notice.originalLenderName, notice.originalLenderAddress]),
    closingDate: closing,
    saleDate,
    repaymentDate: repayment,
    line7: holdingPeriod(closing, saleDate),
    gain: gainLines(sale.salesPrice, sale.expensesOfSale, sale.adjustedBasis),
    gainIncludedInIncome: sale.gainIncludedInIncome,
    line16,
    line19: subsidizedAmountForInterest(notice.federallySubsidizedAmount, sale.ownershipShare),
    line20: worksheet?.lineH ?? row?.holdingPeriodPercentage,
    worksheet,
    gap: gapOf(sale, line16),
  };
}

/* Schedule 2 files for a copy with a gap, or when a tax above 0 is possible: a gain and lines 19 and 20 above 0. */
function reachesSchedule2(lines: Form8828FactLines | undefined): boolean {
  if (lines === undefined) return false;
  if (lines.gap !== undefined) return true;
  return (lines.gain.line14 ?? 0) > 0 && lines.line19 > 0 && (lines.line20 ?? 0) > 0;
}

/*
 * Who files: a taxpayer who "sold or otherwise disposed of" a home with a
 * federal mortgage subsidy from a loan provided after 1990
 * (irs-8828-inst-2025::sec::who-must-file::b01), whether or not there was a
 * gain. A sale fact of a home files the form; the explicit decision still wins.
 * The form asks for the issuer's notice of each sold home: lines 3 to 5, 16, 19
 * and 20 come from it (::specific-instructions::b01).
 *
 * One copy for each home that files: "figure the actual recapture tax
 * separately" for each interest (::special-rules::b02), and the form's Part I
 * describes one home. When only the explicit decision files it (every sold home
 * is outside the 9 years), each sold home is a copy.
 */
export function resolve8828Info(inputs: ResolverInputs): Form8828FilingInfo {
  const sold = getMortgageSubsidyHomes(inputs.facts).filter(isSold);
  const filing = sold.filter(files);
  const mustFile = resolveMustFile(inputs.decisionByKey, {
    explicitKey: "decisions.scope.must_file_8828",
    fallbacks: [
      {
        rule: `fallback: ${filing.length} sold home(s) with a federal mortgage subsidy, the loan closed after 1990 and sold within 9 years`,
        value: filing.length > 0,
        triggeredByFactKeys: filing.map((home) => home.saleKey),
      },
    ],
  });
  if (mustFile.value !== true) return { mustFile: { "form-8828": mustFile } };
  const asked = sold.filter((home) => home.notice === undefined).map((home) => home.noticeKey);
  const copies = (filing.length > 0 ? filing : sold).map((home) =>
    home.notice ? factLines(home.notice, home.sale) : undefined,
  );
  return {
    mustFile: { "form-8828": mustFile },
    missingInputs: { "form-8828": asked },
    form8828Copies: copies,
    form8828ReachesSchedule2: copies.some(reachesSchedule2),
  };
}
